var request = require("request");
var http = require('http');
const fs = require('fs');
var express = require('express');
var timespan = require('timespan');
var url = require('url');

var playTimeout = []; // pointer to the next command schedule
var tomorrowPlayTimeout;
var recTimeout; // pointer to the timer to read from bus

var app = express();
var precBody = null;

// the state of simulator: 
var status;

// The inmemory snapshot for the current week record or recorded days to play
var Simulog;


function isMidNight() {
    currenttime = new Date();
    if (currenttime.getHours() == 0 && currenttime.getMinutes() == 0 && currenttime.getSeconds() <= 2)
        return true;
    else
        return false;

}

function SaveStatus()
{
    fs.writeFile('status.json', JSON.stringify(status), function (err) {
        if (err != null)
            console.log('Error saving status. Error:' + err);
        else {

            console.log('status.json saved with success');
        }
    });

}

function Init() {

    console.log('Initialize status');
    status = { status: 'idle', catalogIdx: -1, startRec: null, stopRec: null };

    if (fs.existsSync('status.json')) {
        console.log('Resume previous status ');
        try {
            status = JSON.parse(fs.readFileSync('status.json', 'utf8', 'r'));

            switch (status.status) {
                case 'rec':
                    Rec(status.catalogIdx);
                    break;
                case 'play':
                    Play(status.catalogIdx);
                    break;
                default:
                    console.log('nothing to resume: prevoius status is ' + status.status);
                    break;
            } 

        } catch (err) {
            console.log('Error resuming previuos status ' + err);
        }
        
    }
   

    Simulog = {
        name: '',
        weekData: {
            0: {state : 'norec', datalog: [] },
            1: {state : 'norec', datalog: [] },
            2: {state : 'norec', datalog: [] },
            3: {state : 'norec', datalog: [] },
            4: {state : 'norec', datalog: [] },
            5: {state : 'norec', datalog: [] },
            6: {state : 'norec', datalog: [] }
        }
    };


}

function ReadCatalog(index) {

    var result;

    if (fs.existsSync(index + '_datalog.json')) {
        console.log('Loading catalog ' + index + '_datalog.json');
        result = JSON.parse(fs.readFileSync(index + '_datalog.json', 'utf8', 'r'));
        return result;
    }
    else {
        console.log('Catalog ' + index + '_datalog.json not exists');
        return null;
    }
}

// Save the name in the catalog x
function Save(index, name) {

    if (index < 0 || index > 12) {
        return 0;
    }

    if (index == Simulog.catalogIdx) // Update current log if index is the same. It will saved 
    {
        Simulog.name = name;
        Log = Simulog;
    }
    else {
        Log = ReadCatalog(index);

        if (!Log) {
            Log = {
                name: name,
                weekData: {
                    0: {state : 'norec', datalog: [] },
                    1: {state : 'norec', datalog: [] },
                    2: {state : 'norec', datalog: [] },
                    3: {state : 'norec', datalog: [] },
                    4: {state : 'norec', datalog: [] },
                    5: {state : 'norec', datalog: [] },
                    6: {state : 'norec', datalog: [] }
                }
            }
        }
        else
            Log.name = name;
    }

    fs.writeFileSync(index + '_datalog.json', JSON.stringify(Log),'utf8');


    return 1;
}

// Activate record for days on configuration x
function Rec(index) {


    // Stop all rec and play and put in idle state
    Stop();
    
    Today = new Date();

    status.status = 'rec';
    status.catalogIdx = index; // save the pointer to the catalog index.
    // Initialize record stop
    status.startRec = Today.getTime();
    status.stopRec = Today.getTime() + 604800000; //next week at the same time
    
    //Load from disk if exists
    Simulog = ReadCatalog(index);

    if (!Simulog) {
         console.log('Initialize new Catalog');
        // Clear Simulog data
        Simulog = {
            name: 'noname', weekData: {
                0: { state: 'norec', datalog: [] },
                1: { state: 'norec', datalog: [] },
                2: { state: 'norec', datalog: [] },
                3: { state: 'norec', datalog: [] },
                4: { state: 'norec', datalog: [] },
                5: { state: 'norec', datalog: [] },
                6: { state: 'norec', datalog: [] }
            }
        };
    }

    Simulog.weekData[Today.getDay()].state = 'inprogress';

    SaveStatus();
    console.log('Start record');
    // create a Timer to record data.
    recTimeout = setInterval(function () {
        var rand = Math.floor(Math.random() * 100000000).toString()
        request("http://192.168.1.252/user/icon_status.json?type=light&_=" + rand, function (error, response, body) {

            date = new Date();

            // If a week if passed then stop record
            if (date.getTime() >= status.stopRec) {
                Simulog.weekData[date.getDay()].state = 'completed';
                Stop();
                return;
            }



            // After 1 days of running, set previous day as completed at midnight if not yet
            if (isMidNight()) {

                // Calculate the previous Day
                if (date.getDay() == 0) {
                    prevDay = 6;
                } else {
                    prevDay = date.getDay() - 1;
                }
                // check if a day is passed
                if ((date.getTime() - status.startRec) >= 86400000 && Simulog.weekData[prevDay].state!='completed') {
                    Simulog.weekData[prevDay].state = 'completed';
                    Simulog.weekData[date.getDay()].datalog = []; // clear logs of the current day
                    console.log('day ' + prevDay + ' is completed');
                } else {
                    Simulog.weekData[prevDay].state = 'partial';
                    console.log('day ' + prevDay + ' is partial');
                }

                Simulog.weekData[date.getDay()].state = 'inprogress';

            }

            newData = JSON.parse(body);

            if (precBody == null || (JSON.stringify(precBody.status) != JSON.stringify(newData.status))) {

                Simulog.weekData[date.getDay()].datalog.push({ Hours: date.getHours(), Minutes: date.getMinutes(), Seconds: date.getSeconds(), Status: newData });

                console.log(Simulog.weekData[date.getDay()].datalog[Simulog.weekData[date.getDay()].datalog.length - 1]);

                fs.writeFile(status.catalogIdx + '_datalog.json', JSON.stringify(Simulog), function (err) {

                });

                precBody = newData;
            }

        });



    }, 1000);
}

// Stop Recording and stop playing
function Stop() {

    today = new Date();

    if (status.status == 'rec') {
        clearInterval(recTimeout);
        Simulog.weekData[today.getDay()].state = 'partial';
        fs.writeFile(status.catalogIdx + '_datalog.json', JSON.stringify(Simulog), function (err) {

        });
        console.log('Stop record');
    }

    if (status.status == 'play') {

        clearTimeout(tomorrowPlayTimeout);
        if (playTimeout.length > 0) {
            while (playTimeout.length > 0) {

                var timeout = playTimeout.pop();
                clearTimeout(timeout.timer);
                console.log('Stop play schedule ' + timeout.name);
            }
        }
        else {
            console.log('Stop play: no schedules');
        }

    }

    status = { status: 'idle', catalogIdx: -1, startRec: null, stopRec: null };
    SaveStatus();

}

function SetBusValues(values) {


    console.log('execute command list' + values.Status.status);
    for (var i = 0; i < values.Status.status.length; i++) {

        var CommandUrl = "http://192.168.1.252/user/action.cgi?type=light&num" + values.Status.status[i] + "=" + i;

        console.log('executed command on out=' + i + ' value=' + values.Status.status[i] + " command: " + CommandUrl);

        request(CommandUrl, function (error, response, body) {
            console.log("Result:" + body);
        }

        );


    }

}

// create timers for current Day
function ScheduleAllDayCommands() {
    var Today = new Date();
    var ts = new timespan.TimeSpan(0, Today.getSeconds(), Today.getMinutes(), Today.getHours(), Today.getDay());

    for (var i = 0; i < Simulog.weekData[Today.getDay()].datalog.length; i++) {
        var ts2 = new timespan.TimeSpan(0, Simulog.weekData[Today.getDay()].datalog[i].Seconds, Simulog.weekData[Today.getDay()].datalog[i].Minutes, Simulog.weekData[Today.getDay()].datalog[i].Hours, Today.getDay());

        var diff = ts2.totalMilliseconds() - ts.totalMilliseconds();

        if (diff >= 0) {
            status.nextPlay = diff;
            var hourstring = Simulog.weekData[Today.getDay()].datalog[i].Hours + ":" + Simulog.weekData[Today.getDay()].datalog[i].Minutes + ":" + Simulog.weekData[Today.getDay()].datalog[i].Seconds;
            console.log('schedule command ' + Simulog.weekData[Today.getDay()].datalog[i].Status.status + ' at: ' + hourstring + " in " + diff / 1000 + " sec");

            playTimeout.push(
                {
                    name: hourstring,
                    timer: setTimeout(function (command) {
                        // Set the output on bus
                        SetBusValues(command);


                    }, diff, Simulog.weekData[Today.getDay()].datalog[i])
                }
            );


        }
    }

    if (playTimeout.length == 0)
    { console.log('no schedule for this day'); }

    // schedule to populate timers for the day after
    var Tomorrow = new Date();
    Tomorrow.setHours(24, 0, 0, 0);

    var nextDaydiff = Tomorrow - Today;

    console.log('schedule new check for tomorrow (in '+ nextDaydiff+ 'ms)');
    tomorrowPlayTimeout=setTimeout(ScheduleAllDayCommands, nextDaydiff);
    
    return 1;
}

// Stop Recording
function Play(index) {

    if (status.status == 'play') {
        Stop(); // Stop all Rec and Play and put in idle state
    }

    if (status.status == 'idle') {
        if (index < 0 && index >= 12) {
            console.log('invalid catalog index: ' + index);
            return -2;
        }

        // Read the catalog from disk
        Simulog = ReadCatalog(index);

        if (Simulog) {
            status.catalogIdx = index;

            ScheduleAllDayCommands();

            status.status = 'play';
            SaveStatus();
            console.log('Play simulation "' + Simulog.name + '"');
            return 1;
        }
        else {
            console.log('cannot play catalog "' + index + '" doesn\'t exists');
            return -1;
        }
    }
    else {
        console.log('Cannot play when status is "' + status.status + '"');
        return 0;
    }


}

function Remove(idx) {

    fs.unlinkSync(idx + '_datalog.json');
    return 1;

}

function getCurrentStatus() {

    var retvalue = { status: null, catalogIdx: -1, startRec: null, stopRec: null, weekdata: [] };

    retvalue.status = status.status;
    retvalue.catalogIdx = status.catalogIdx;
    retvalue.startRec = status.startRec;
    retvalue.stopRec = status.stopRec;

    for (var i = 0; i < Object.keys(Simulog.weekData).length; i++) {
        retvalue.weekdata.push(Simulog.weekData[i].state);
    }
    return (JSON.stringify(retvalue));
}

function CatalogList()
{
    var result = [];

    for (var i = 0; i < 12; i++)
    {
        var catalog = ReadCatalog(i);
        result.push({index: i, name: null, weekstate:[]});
        
        if (catalog) {
            result[i].name = catalog.name;
            for (var a = 0; a < 7; a++) {
                result[i].weekstate.push(catalog.weekData[a].state);
            }
        }
        
    }

    return result;

}

app.get("/status", function (request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(getCurrentStatus());
});

app.get("/rec", function (request, response) {

    var queryData = url.parse(request.url, true).query;
    Rec(queryData.idx);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('1');
});

app.get("/play", function (request, response) {

    var queryData = url.parse(request.url, true).query;
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    var result = Play(queryData.idx);
    response.end(JSON.stringify(result));
});

app.get("/remove", function (request, response) {

    var queryData = url.parse(request.url, true).query;
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    var result = Remove(queryData.idx);
    response.end(JSON.stringify(result));
});

app.get("/save", function (request, response) {

    var queryData = url.parse(request.url, true).query;
    Save(queryData.idx, queryData.name);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('1');
});

app.get("/stop", function (request, response) {
    Stop();
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('1');
});

app.get("/catalog", function (request, response) {
    var retvalue= CatalogList();
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(JSON.stringify(retvalue));
});

Init();
app.listen(8080);


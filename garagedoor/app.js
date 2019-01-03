// Requires
var express = require('express');
var path = require('path');
var nodemailer = require("nodemailer");
var request = require("request");
var smtpTransport = require('nodemailer-smtp-transport');
var querystring = require('querystring');
var url = require('url');
var gpio = require('rpi-gpio');
var sleep = require('sleep');
const onvif = require('node-onvif');
var FCstate = false;
var FAstate = false;
var DoorStatus='';
const fs = require('fs');
var configFile = require('./config.js');
var screenshots = new Array();     
var waiting = {};

//Object forEachDone

Object.defineProperty(Array.prototype, "forEachDone", {
        enumerable: false,
        value: function(task, cb){
            var counter = 0;
            this.forEach(function(item, index, array){
                task(item, index, array);
                if(array.length === ++counter){
                    if(cb) cb();
                }
            });
        }
      });
      
      
      //Array forEachDone
      
      Object.defineProperty(Object.prototype, "forEachDone", {
        enumerable: false,
        value: function(task, cb){
            var obj = this;
            var counter = 0;
            Object.keys(obj).forEach(function(key, index, array){
                task(obj[key], key, obj);
                if(array.length === ++counter){
                    if(cb) cb();
                }
            });
        }
      });
      

// Create app
var app = express();
var port =80;

//Setup mails
var transporter = nodemailer.createTransport(smtpTransport(configFile.mail.account));

// Init Fine corsa
function InitFA()
{
 gpio.read(12, function(err, value) {
         if (!err)
         {
                FAstate=value;
                console.log('init status FA: ' + value);
				if (FAstate ) {DoorStatus='Fully Opened'};
				if (!FCstate && !FAstate ) {DoorStatus='Partial Open'};
        }
        else
        {console.log('Error reading pin 12 (FA): ' + err); }

    });
}

function InitFC()
{
gpio.read(16, function(err, value) {
         if (!err)
         {
                FCstate=value;
				 console.log('init status FC: ' + value);
				if (FCstate ) {DoorStatus='Closed'};
				if (!FCstate && !FAstate ) {DoorStatus='Partial Open'};
               
        }
        else
        {console.log('Error reading pin 16(FC) : ' + err); }

    });
}

//Listening Endrun switch
gpio.on('change', function(channel, value) {

        if (channel==16) // FC Chiuso
        {
                if (value==false && FCstate==true)
                {
			DoorStatus='Door Opening';
                        console.log(DoorStatus);
                    
                        // Send mail with screenshot after 3 seconds
                        setTimeout(function(){
                                SendAlert('Garage Door Opening','La porta del garage si sta aprendo');
                         }, 3000);
                         
                }
                else
                {
                   if (value==true && FCstate==false)
                    {
                        SendAlert('Garage Door Closed','La porta del garage si è chiusa');
                        DoorStatus='Door Closed';
                        console.log(DoorStatus);
                    }
                }

                FCstate=value;
                sleep.sleep(2); // Anti rimbalzo

        }

        if (channel==12 && !FCstate) // FC Aperto
        {
                if (value==true && FAstate==false)
                {
                    DoorStatus='Door Opened';
                    console.log(DoorStatus);
                }
                else
                {
                    if (value==false && FAstate==true)
                    {
                        DoorStatus='Door Closing';
			console.log(DoorStatus);
                    }
                }

                FAstate=value;
                sleep.sleep(2); // Anti rimbalzo

        }

        if (channel!=12 && channel!=16)
        {
                console.log('Channel ' + channel + ' value is now ' + value);
        }
}
);

gpio.setup(7, gpio.DIR_OUT);
gpio.setup(12, gpio.DIR_IN, gpio.EDGE_BOTH, InitFA); // Open EndRun FA
gpio.setup(16, gpio.DIR_IN, gpio.EDGE_BOTH, InitFC); // Closed Endrun FC

setInterval(InitFA,1000);
setInterval(InitFC,1000);

// Set views
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Serve files
app.get('/interface', function(request, response){
  response.sendfile('views/interface.html')
});

app.get('/', function(request, response){
  response.sendfile('views/interface.html')
});

function SendAlert(subject,text){

        waiting[subject]={id:configFile.cameras.length, screenshots:[]};
       
        console.log('Init process id: ' + subject);
    
        configFile.cameras.forEach(function(item){
                GetScreenshot(item,subject,text, sendMail, subject) //call finish after each entry
        })
    }

    function GetScreenshot(cam,subject, text, callback, PID){
        //asynchronousjob with entry
             // Create an OnvifDevice object
             let camera1 = new onvif.OnvifDevice({
              xaddr: cam.xaddr,
              user : cam.user,
              pass : cam.pass
            });
      
            // Initialize the OnvifDevice object
            camera1.init().then(() => {
                                      // Get the data of the snapshot
                                      console.log('fetching the data from camera ' + cam.name + '  of the snapshot...');
                                      return camera1.fetchSnapshot();
                                      }).then((res) => {
                                        waiting[PID].screenshots.push({filename: cam.name +'.jpg', content: new Buffer(res.body,'binary')})
                                                      // Save the data to a file
                                                      //  fs.writeFileSync('snapshot.jpg', res.body, {encoding: 'binary'});
      
                                                        console.log('Done! ' + cam.name +'.jpg');
                                                        callback(subject,text,PID);
                                                        }
                                              ).catch((error) => {
                                                                    console.error('Error on PID:'+PID +'=>' + error);
                                                                    callback(subject,text + '\n\rError getting snapshot from "'+cam.name+ '":' + error.toString()  ,PID);
                                                                  })
      }
    
    function sendMail(subject, text,PID){
        waiting[PID].id--;
        if (waiting[PID].id==0) {
            
            //Setup mails
            var transporter = nodemailer.createTransport(smtpTransport(configFile.mail.account));
    
            //do your Job intended to be done after forEach is completed
            console.log('Process ID:' + PID + ' Sending Mail ' + subject + ' Attach:' +waiting[PID].screenshots.length  + ' process remaining:' + Object.keys(waiting).length );
            //SendMail('surveliancelazzahome@gmail.com','surveliancelazzahome@gmail.com','test','test',screenshots);
            configFile.mail.to.forEach(function (mailTo){
                transporter.sendMail({
                                        from: configFile.mail.from,
                                        to: mailTo,
                                        subject: subject,
                                        text: text,
                                        attachments: waiting[PID].screenshots
                                        })
                });
                delete waiting[PID];
            } 
      }
    



function DoorIsOpen ()
{
	return !FCstate;
}

function Switch (io, state)
{
        gpio.write(io, state, function(err) {
        if (err)
                console.log('error: ' + err);
         else
                console.log('Written pin:' + io + ' value:'+state);
        });

        if (state==true && FCstate==true)
        {
                SendAlert('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door is opening','La porta del garage si sta aprendo');
                setTimeout(function(){
                                request("http://192.168.1.11:8080/cgi-bin/logical_input.cgi?name=OpGarageMobile", function(error, response, body) {
                                console.log(body);
                                });
                        }, 5000);
        }



}


// Send commands to PI
app.get("/control", function(request, response){

    // Get data
    var queryData = url.parse(request.url, true).query;
    console.log("State " + queryData.state + " received.");
  // Answer
    response.writeHead(200, {"Content-Type": "text/html",
                                                     "Cache-Control": "no-cache, must-revalidate",
                                                         "Pragma": "no-cache",
														 "Expires": "Sat, 26 Jul 1997 05:00:00 GM"});

    // Apply command
    if (queryData.state == 'switch') {

        Switch(7,true);
        setTimeout(Switch, 500,7,false);
		response.write("{\"result\":\"OK\"}");
    }
	 if (queryData.state == 'doorisopen') {

         response.write("{\"result\":"+ DoorIsOpen() +", \"state\":\""+DoorStatus+"\"}");

    }

  
       
    response.end();
});

// Start server
app.listen(port);

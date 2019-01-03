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
var FCstate = false;
var FAstate = false;
var DoorStatus='';

// Create app
var app = express();
var port =80;

//Setup mails
var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'surveliancelazzahome@gmail.com',
        pass: 'surveliance2015.'
    }
}));

// Init Fine corsa
function InitFA()
{
 gpio.read(12, function(err, value) {
         if (!err)
         {
                FAstate=value;
                console.log('init status FA: ' + value);
				if (FAstate ) {DoorStatus='Fully Opened'};
				if (!FCstate && !FAstate && DoorStatus=='' ) {DoorStatus='Partial Open'};
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
				if (!FCstate && !FAstate && DoorStatus=='') {DoorStatus='Partial Open'};
               
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
                // Send email
                        SendMail('surveliancelazzahome@gmail.com','surveliancelazzahome@gmail.com','Garage Door Opening','La porta del garage si sta aprendo');
                //      SendMail('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door Opening','La porta del garage si sta aprendo');

                        // Send alarm to NAS-Surveillance station
                        setTimeout(function(){
                                        request("http://192.168.1.11:8080/cgi-bin/logical_input.cgi?name=OpGarage", function(error, response, body) {
                                        console.log(body);
                                        });
                         }, 5000);
                }
                else
                {
                   if (value==true && FCstate==false)
                    {
                        SendMail('surveliancelazzahome@gmail.com','surveliancelazzahome@gmail.com','Garage Door Closed','La porta del garage si è chiusa');
        //      SendMail('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door Closed','La porta del garage si è chiusa');

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
                // Send email
                        SendMail('surveliancelazzahome@gmail.com','surveliancelazzahome@gmail.com','Garage Door Opened','La porta del garage è completamente aperta');
                //      SendMail('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door Opened','La porta del garage è completamente aperta');
                }
                else
                {
                        if (value==false && FAstate==true)
                    {
                                SendMail('surveliancelazzahome@gmail.com','surveliancelazzahome@gmail.com','Garage Door Closing','La porta del garage si sta chiudendo');
                        //      SendMail('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door Closing','La porta del garage si sta chiudendo');
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

function SendMail(from, to, subject, text)
{
        transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    text: text
});
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
                 SendMail('surveliancelazzahome@gmail.com','vale.penna79@gmail.com','Garage Door is opening','La porta del garage si sta aprendo');
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

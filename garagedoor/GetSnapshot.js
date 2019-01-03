const onvif = require('node-onvif');
const fs = require('fs');
var configFile = require('./config.js');
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
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


  SendAlert('test1','test1');
 // SendAlert('test2','test2');
 // SendAlert('test3','test3');


//


//    
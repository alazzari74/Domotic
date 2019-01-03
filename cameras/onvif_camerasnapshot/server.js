const onvif = require('node-onvif');
var express = require('express');
var url = require('url');
const fs = require('fs');
var configFile = require('./config/config.js');
var waiting = {};

// Create app
var app = express();
var port =80;


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




function GetScreenshot(cam, callback,response){
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
                                    console.log('Done! ' + cam.name );
                                    callback(new Buffer(res.body,'binary'),response);
                                     // Save the data to a file
                                     //  fs.writeFileSync('snapshot.jpg', res.body, {encoding: 'binary'});
                                                    }
                                          ).catch((error) => {
                                                                console.error('Error getting snapshot from "'+cam.name+ '":' + error.toString());
                                                                response.end();
                                                              })
  }

function sendResponse(buffer,response)
{
    response.write(buffer);
    response.end();

}


// Send commands to PI
app.get("/getscreenshot", function(request, response){

    // Get data
    var queryData = url.parse(request.url, true).query;
    console.log("CAM " + queryData.cam + " received.");
  // Answer

  response.writeHead(200, {"Content-Type": "image/jpeg",
  "Cache-Control": "no-cache, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "Sat, 26 Jul 1997 05:00:00 GM"});

  var cam = configFile.cameras.find(o => o.name === queryData.cam);
    
if (cam!=undefined)
{
    GetScreenshot(cam, sendResponse,response);

}
else
{
    response.end();
}
      
       
  
});

// Start server
app.listen(port);
 
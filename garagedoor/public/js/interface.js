// Function to control the relay

var json_obj;
var calling = false;

function buttonClick(clicked_id){

  if (clicked_id == "1"){
    $.ajax({
      type: 'GET',
      url: '/control',
      async: false,
      data: {state: 'switch'},
      success: function( data ) {
        json_data = jQuery.parseJSON(data);
      }
    });  
  } 

  
}

function Get(yourUrl){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET",yourUrl,false);
    Httpreq.send(null);
    return Httpreq.responseText;          
}



function updateStatus()
{
	
	var canvas = document.getElementById('myCanvas');
	var label= document.getElementById('lblstatus');
    var context = canvas.getContext('2d');
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = canvas.height /2;
    var fillText='WAIT';
    var xhr = new XMLHttpRequest();

//Init Canvas	
if (!json_obj)
{
	context.fillStyle ='orange';
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	context.fill();
	context.font = "3vw Arial";
	context.fillStyle = "white";
	context.textAlign = "center";
	context.fillText(fillText,centerX,centerY+5);
}

//if (!calling)
//{
	calling=true;
	console.log('calling: ' + calling)

	$.getJSON( "/control?state=doorisopen",function(result){

    json_obj=result;
    console.log('Door is open: '+ json_obj.result + 'Door State:' + json_obj.state)
    if (json_obj)
		{
			label.innerHTML=json_obj.state;
			
			if (json_obj.result)
			{	context.fillStyle = 'red';
				fillText='OPENED';}
			else
			{	context.fillStyle = 'green';
				fillText='CLOSED';
			}
		
		  
		} else {
			fillText='ERROR';
		  console.error(xhr.statusText);
		}
		
		context.fill();
		context.fillStyle = "white";
		context.fillText(fillText,centerX,centerY+5);
		calling=false;
		console.log('calling: ' + calling)
	  }

 );
 //};
/*	xhr.open("GET", "/control?state=doorisopen", true);
	calling=true;
	
	xhr.onload = function (e) {
	  if (xhr.readyState === 4) {
		if (xhr.status === 200) {
			
		  console.log(xhr.responseText);
		  json_obj=JSON.parse(xhr.responseText);
		  
		  if (result)
		  {
			if (result.result)
			{	context.fillStyle = 'red';
				fillText='OPENED';}
			else
			{	context.fillStyle = 'green';
				fillText='CLOSED';
			}
		  }
		  
		} else {
			fillText='ERROR';
		  console.error(xhr.statusText);
		}
		  context.fill();
		  context.fillStyle = "white";
		  context.fillText(fillText,centerX,centerY+5);
	  }
	  calling=false;
	};
	
xhr.onerror = function (e) {
  console.error(xhr.statusText);
    calling=false;
};
xhr.send(null);
  */
      
	
}
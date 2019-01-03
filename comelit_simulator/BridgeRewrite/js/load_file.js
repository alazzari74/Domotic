var timeout;
var downloaded_file = [];
var downloaded = 0;

var load_url = [
	['//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js', 'js'],
	['/js/bridge.min.js?ver=7370','js'],
	['/js/lang.js?ver=7370','js'],
	['//ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/jquery-ui.min.js','js'],
	['//ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/themes/cupertino/jquery-ui.css','css']
]

function loadHeadFile(b,c){var a;"js"==c?(a=document.createElement("script"),a.setAttribute("type","text/javascript"),a.setAttribute("src",b)):"css"==c&&(a=document.createElement("link"),a.setAttribute("rel","stylesheet"),a.setAttribute("type","text/css"),a.setAttribute("href",b));if("undefined"!=typeof a)return document.getElementsByTagName("body")[0].appendChild(a),a};

function local_load(){
	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}
	document.getElementsByTagName("body")[0].removeChild(downloaded_file[0]);
	load_url[0][0] = '/js/jquery-1.11.1.min.js';
	load_url[3][0] = '/js/jquery-ui/jquery-ui.1.11.0.min.js';
	load_url[4][0] = '/js/jquery-ui/jquery-ui.1.11.0.min.css';
	downloaded_file[0] = loadHeadFile(load_url[0][0], load_url[0][1]);
	downloaded_file[0].onload = function(){ 
		complete_download();
	};
};

//Load the script
function starting_load() {
	loadHeadFile('/bridge_white.css?ver=7370','css');
	timeout = setTimeout(local_load, 3000);
	downloaded_file[0] = loadHeadFile(load_url[downloaded][0], load_url[downloaded][1]);
	document.getElementById('inner').style.width = ((++downloaded / load_url.length) * 100) + '%';
	downloaded_file[0].onerror = local_load;
	downloaded_file[0].onload = function(){ 
		complete_download();
	};
}

function complete_download() {
	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}
	for (var i = 1; i < load_url.length; i++) {
		downloaded_file[i] = loadHeadFile(load_url[i][0], load_url[i][1]);
		if (load_url[i][1] == 'js') {
			downloaded_file[i].onload = function() {
				document.getElementById('inner').style.width = ((++downloaded / load_url.length) * 100) + '%';
				if (downloaded >= load_url.length) {
					AppDisplay();
					start();
				}
			};
		} else {
			document.getElementById('inner').style.width = ((++downloaded / load_url.length) * 100) + '%';
		}
	}
}
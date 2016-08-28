function main() {

    checkVersion();	

}

function checkVersion() {
	// TODO proper Chromium/Chrome/other detection; UserAgent-based?
	try {
		//if (WEBVR.isLatestAvailable() === false) {
			window.open("./cardboard/", "_self");
		//} else {
			//window.open("./vive", "_self");
		//}
	} catch (err){
		window.open("menu.html", "_self");
	}
}

window.onload = main;
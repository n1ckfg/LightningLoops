function main() {

    checkVersion();	

}

function checkVersion() {
	// TODO proper Chromium/Chrome/other detection; UserAgent-based?
	try {
		if (WEBVR.isLatestAvailable() === false) {
			window.open("../../cardboard_avlt/", "_self");
		} else {
			window.open("../../vive_avlt", "_self");
		}
	} catch (err){
		window.open("menu.html", "_self");
	}
}

window.onload = main;
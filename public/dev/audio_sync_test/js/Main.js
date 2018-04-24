//Handles HTML and wiring data
//Using Three v60

var events = new Events();

var UberVizMain = function() {

	function init() {

		document.onselectstart = function() {
			return false;
		};
		document.addEventListener('drop', onDocumentDrop, false);
		document.addEventListener('dragover', onDocumentDragOver, false);

		AudioHandler.init();
		ControlsHandler.init();

		update();

	}

	function update() {
		requestAnimationFrame(update);
		events.emit("update");
	}

	function onDocumentDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}

	//load dropped MP3
	function onDocumentDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		AudioHandler.onMP3Drop(evt);
	}

	return {
		init:init
	};

}();

$(document).ready(function() {
	UberVizMain.init();
});
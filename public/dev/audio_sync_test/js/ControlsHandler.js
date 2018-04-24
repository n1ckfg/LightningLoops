
var ControlsHandler = function() {

	
	var audioParams = {
		useMic: false,
		useSample:true,
		volSens:1,
		beatHoldTime:40,
		beatDecayRate:0.97,
		sampleURL: "./sounds/Cissy_Strut_Edit.mp3"
	};

	function init(){

		//Init DAT GUI control panel
		gui = new dat.GUI({autoPlace: false });
		$('#controls').append(gui.domElement);
		var f2 = gui.addFolder('Settings');
		f2.add(audioParams, 'useMic').listen().onChange(AudioHandler.onUseMic).name("Use Mic");
		f2.add(audioParams, 'volSens', 0, 5).step(0.1).name("Gain");
		f2.add(audioParams, 'beatHoldTime', 0, 100).step(1).name("Beat Hold");
		f2.add(audioParams, 'beatDecayRate', 0.9, 1).step(0.01).name("Beat Decay");
		f2.open();

		AudioHandler.onUseMic();
		AudioHandler.onUseSample();

	}

	return {
		init:init,
		audioParams: audioParams,
	};
}();
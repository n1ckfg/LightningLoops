
var AudioHandler = function() {

	var waveData = []; //waveform - from 0 - 1 . no sound is 0.5. Array [binCount]
	var levelsData = []; //levels of each frequecy - from 0 - 1 . no sound is 0. Array [levelsCount]
	var level = 0; // averaged normalized level from 0 - 1
	var bpmTime = 0; // bpmTime ranges from 0 to 1. 0 = on beat. Based on tap bpm
	var ratedBPMTime = 550;//time between beats (msec) multiplied by BPMRate
	var levelHistory = []; //last 256 ave norm levels
	var bpmStart; 

	var sampleAudioURL = "../res/mp3/Cissy_Strut_Edit.mp3";
	var BEAT_HOLD_TIME = 40; //num of frames to hold a beat
	var BEAT_DECAY_RATE = 0.98;
	var BEAT_MIN = 0.15; //a volume less than this is no beat

	//BPM STUFF
	var count = 0;
	var msecsFirst = 0;
	var msecsPrevious = 0;
	var msecsAvg = 633; //time between beats (msec)
	
	var timer;
	var gotBeat = false;
	var beatCutOff = 0;
	var beatTime = 0;

	var debugCtx;
	var debugW = 330;
	var debugH = 250;
	var chartW = 300;
	var chartH = 250;
	var aveBarWidth = 30;
	var debugSpacing = 2;
	var gradient;

	var freqByteData; //bars - bar data is from 0 - 256 in 512 bins. no sound is 0;
	var timeByteData; //waveform - waveform data is from 0-256 for 512 bins. no sound is 128.
	var levelsCount = 16; //should be factor of 512
	
	var binCount; //512
	var levelBins;

	var isPlayingAudio = false;

	var source;
	var buffer;
	var audioBuffer;
	var dropArea;
	var audioContext;
	var analyser;

	function init() {

		//EVENT HANDLERS
		events.on("update", update);

		audioContext = new window.webkitAudioContext();
		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.8; //0<->1. 0 is no time smoothing
		analyser.fftSize = 1024;
		analyser.connect(audioContext.destination);
		binCount = analyser.frequencyBinCount; // = 512

		levelBins = Math.floor(binCount / levelsCount); //number of bins in each level

		freqByteData = new Uint8Array(binCount); 
		timeByteData = new Uint8Array(binCount);

		var length = 256;
		for(var i = 0; i < length; i++) {
		    levelHistory.push(0);
		}

		//INIT DEBUG DRAW
		var canvas = document.getElementById("audioDebug");
		debugCtx = canvas.getContext('2d');
		debugCtx.width = debugW;
		debugCtx.height = debugH;
		debugCtx.fillStyle = "rgb(40, 40, 40)";
		debugCtx.lineWidth=2;
		debugCtx.strokeStyle = "rgb(255, 255, 255)";
		$('#audioDebugCtx').hide();

		gradient = debugCtx.createLinearGradient(0,0,0,256);
		gradient.addColorStop(1,'#330000');
		gradient.addColorStop(0.75,'#aa0000');
		gradient.addColorStop(0.5,'#aaaa00');
		gradient.addColorStop(0,'#aaaaaa');

	}

	function initSound(){
		source = audioContext.createBufferSource();
		source.connect(analyser);
	}

	//load sample MP3
	function loadSampleAudio() {

		stopSound();

		initSound();

		
		// Load asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", ControlsHandler.audioParams.sampleURL, true);
		request.responseType = "arraybuffer";

		request.onload = function() {


			audioContext.decodeAudioData(request.response, function(buffer) {
				audioBuffer = buffer;
				startSound();
			}, function(e) {
				console.log(e);
			});


		};
		request.send();
	}

	function onTogglePlay(){

		if (ControlsHandler.audioParams.play){
			startSound();
		}else{
			stopSound();
		}
	}

	function startSound() {
		source.buffer = audioBuffer;
		source.loop = true;
		source.start(0.0);
		isPlayingAudio = true;
		//startViz();

		$("#preloader").hide();
	}

	function stopSound(){
		isPlayingAudio = false;
		if (source) {
			source.stop(0);
			source.disconnect();
		}
		debugCtx.clearRect(0, 0, debugW, debugH);
	}

	function onUseMic(){

		if (ControlsHandler.audioParams.useMic){
			ControlsHandler.audioParams.useSample = false;
			getMicInput();
		}else{
			stopSound();
		}
	}
	
	function onUseSample(){
		if (ControlsHandler.audioParams.useSample){
			loadSampleAudio();          
			ControlsHandler.audioParams.useMic = false;
		}else{
			stopSound();
		}
	}
	//load dropped MP3
	function onMP3Drop(evt) {

		//TODO - uncheck mic and sample in CP

		ControlsHandler.audioParams.useSample = false;
		ControlsHandler.audioParams.useMic = false;

		stopSound();

		initSound();

		var droppedFiles = evt.dataTransfer.files;
		var reader = new FileReader();
		reader.onload = function(fileEvent) {
			var data = fileEvent.target.result;
			onDroppedMP3Loaded(data);
		};
		reader.readAsArrayBuffer(droppedFiles[0]);
	}

	//called from dropped MP3
	function onDroppedMP3Loaded(data) {

		if(audioContext.decodeAudioData) {
			audioContext.decodeAudioData(data, function(buffer) {
				audioBuffer = buffer;
				startSound();
			}, function(e) {
				console.log(e);
			});
		} else {
			audioBuffer = audioContext.createBuffer(data, false );
			startSound();
		}
	}

	function getMicInput() {

		stopSound();

		//x-browser
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		if (navigator.getUserMedia ) {

			navigator.getUserMedia(

				{audio: true}, 

				function(stream) {

					//reinit here or get an echo on the mic
					source = audioContext.createBufferSource();
					analyser = audioContext.createAnalyser();
					analyser.fftSize = 1024;
					analyser.smoothingTimeConstant = 0.3; 

					microphone = audioContext.createMediaStreamSource(stream);
					microphone.connect(analyser);
					isPlayingAudio = true;
					// console.log("here");
				},

				// errorCallback
				function(err) {
					alert("The following error occured: " + err);
				}
			);
			
		}else{
			alert("Could not getUserMedia");
		}
	}

	function onBeat(){
		gotBeat = true;
		if (ControlsHandler.audioParams.bpmMode) return;
		events.emit("onBeat");
	}


	//called every frame
	//update published viz data
	function update(){



		if (!isPlayingAudio) return;

		//GET DATA
		analyser.getByteFrequencyData(freqByteData); //<-- bar chart
		analyser.getByteTimeDomainData(timeByteData); // <-- waveform

		//console.log(freqByteData);

		//normalize waveform data
		for(var i = 0; i < binCount; i++) {
			waveData[i] = ((timeByteData[i] - 128) /128 )* ControlsHandler.audioParams.volSens;
		}
		//TODO - cap levels at 1 and -1 ?

		//normalize levelsData from freqByteData
		for(var i = 0; i < levelsCount; i++) {
			var sum = 0;
			for(var j = 0; j < levelBins; j++) {
				sum += freqByteData[(i * levelBins) + j];
			}
			levelsData[i] = sum / levelBins/256 * ControlsHandler.audioParams.volSens; //freqData maxs at 256

			//adjust for the fact that lower levels are percieved more quietly
			//make lower levels smaller
			//levelsData[i] *=  1 + (i/levelsCount)/2;
		}
		//TODO - cap levels at 1?

		//GET AVG LEVEL
		var sum = 0;
		for(var j = 0; j < levelsCount; j++) {
			sum += levelsData[j];
		}
		
		level = sum / levelsCount;

		levelHistory.push(level);
		levelHistory.shift(1);

		//BEAT DETECTION
		if (level  > beatCutOff && level > BEAT_MIN){
			onBeat();
			beatCutOff = level *1.1;
			beatTime = 0;
		}else{
			if (beatTime <= ControlsHandler.audioParams.beatHoldTime){
				beatTime ++;
			}else{
				beatCutOff *= ControlsHandler.audioParams.beatDecayRate;
				beatCutOff = Math.max(beatCutOff,BEAT_MIN);
			}
		}


		bpmTime = (new Date().getTime() - bpmStart)/msecsAvg;
		//trace(bpmStart);

		debugDraw();
	}

	

	function debugDraw(){

		debugCtx.clearRect(0, 0, debugW, debugH);
		//draw chart bkgnd
		debugCtx.fillStyle = "#000";
		debugCtx.fillRect(0,0,debugW,debugH);

		//DRAW BAR CHART
		// Break the samples up into bars
		var barWidth = chartW / levelsCount;
		debugCtx.fillStyle = gradient;
		for(var i = 0; i < levelsCount; i++) {
			debugCtx.fillRect(i * barWidth, chartH, barWidth - debugSpacing, -levelsData[i]*chartH);
		}

		//DRAW AVE LEVEL + BEAT COLOR
		if (beatTime < 6){
			debugCtx.fillStyle="#FFF";
		}
		debugCtx.fillRect(chartW, chartH, aveBarWidth, -level*chartH);

		//DRAW CUT OFF
		debugCtx.beginPath();
		debugCtx.moveTo(chartW , chartH - beatCutOff*chartH);
		debugCtx.lineTo(chartW + aveBarWidth, chartH - beatCutOff*chartH);
		debugCtx.stroke();

		//DRAW WAVEFORM
		debugCtx.beginPath();
		for(var i = 0; i < binCount; i++) {
			debugCtx.lineTo(i/binCount*chartW, waveData[i]*chartH/2 + chartH/2);
		}
		debugCtx.stroke();


	}



	return {
		onMP3Drop: onMP3Drop,
		onUseMic:onUseMic,
		onUseSample:onUseSample,
		update:update,
		init:init,
		level:level,
		levelsData:levelsData,
		onTogglePlay:onTogglePlay
	};

}();
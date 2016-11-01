"use strict";

// https://github.com/mrdoob/three.js/wiki/Drawing-lines
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html
// https://github.com/spite/THREE.MeshLine

/*
var g = new THREE.MeshLine();
g.setGeometry( geo );

var material = new THREE.MeshLineMaterial( { 
    useMap: false,
    color: new THREE.Color( colors[ c ] ),
    opacity: 1,
    resolution: resolution,
    sizeAttenuation: false,
    lineWidth: 10,
    near: camera.near,
    far: camera.far
});
var mesh = new THREE.Mesh( g.geometry, material );
graph.add( mesh );
*/

function main() {

    var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    var hidden = false;
    var lightningArtistData;
    var laScale = 100;
    var laOffset = new THREE.Vector3(0, -20, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
    var laRot = new THREE.Vector3(0, 0, 0);//145, 10, 0);
    var counter = 0;
    var loopCounter = 0;
    var subsCounter = 0;
    var subsFrameOffset = 44;
    var fps = 12.0;
    var frameInterval = (1.0/fps);// * 1000;
    var frameDelta = 0;
    var time = 0;
    var pTime = 0;
    var pauseAnimation = false;

    // ~ ~ ~ 
    var line_mtl, red_mtl, text_mtl;
    var textMesh;

    // http://threejs.org/examples/webgl_materials_blending_custom.html
    var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
    var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
    var blending = "CustomBlending";

    /*
    line_mtl = new THREE.MeshLineMaterial({
        useMap: false,
        color: 0xaaaaaa,
        opacity: 0.5,
        resolution: resolution,
        sizeAttenuation: false,
        lineWidth: 10,
        near: camera.near,
        far: camera.far,
        transparent: true,
        blending: THREE[blending],
        blendSrc: THREE[blendSrc[4]],
        blendDst: THREE[blendDst[1]],
        blendEquation: THREE.AddEquation
    });
    */

    line_mtl = new THREE.MeshLineMaterial();

    text_mtl = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: true 
    });

    red_mtl = line_mtl;
    //red_mtl.color.setHex(0xffaaaa);
    // ~ ~ ~ 

    var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];
    var strokeColors = [];
    var frameColors = [];
    var frames = [];
    var minDistance = 0.01;
    var useMinDistance = false;
    var roundValues = true;
    var numPlaces = 7;

    var useAudioSync = false;
    var soundPath = "../sounds/avlt.mp3";
    var animationPath = "../animations/first_color.json";
    var brushPath = "../images/brush_cardboard.png";

    init();

    var player = new Tone.Player({
        "url": soundPath
    }).toMaster();

    /*
    var listener = new THREE.AudioListener();
    camera.add(listener);

    var sound1 = new THREE.Audio(listener);
    sound1.load("./sounds/test.mp3");
    sound1.setRefDistance(20);
    sound1.autoplay = true;
    scene.add(sound1);
    */

    // ~ ~ ~ ~ ~ ~ 
    document.addEventListener("visibilitychange", visibilityChanged);

    function visibilityChanged() {
        /*
        if (document.hidden || document.mozHidden || document.msHidden || document.webkitHidden) {
            hidden = true;
            Tone.Transport.stop();
            console.log("hidden");
        } else {
            hidden = false;
            Tone.Transport.start();
            counter = 0;
            subsCounter = 0;
            loopCounter = 0;
            scheduleSubtitles();
            console.log("not hidden");
        }
        */
    }
    // ~ ~ ~ ~ ~ ~ 

    loadJSON(animationPath, function(response) {
        lightningArtistData = JSON.parse(response).grease_pencil[0].layers[0];
        
        var frameCount = lightningArtistData.frames.length;
        var strokeCount = 0;
        var pointCount = 0;
        for (var i=0; i<lightningArtistData.frames.length; i++) {
            strokeCount += lightningArtistData.frames[i].strokes.length;
            for (var j=0; j<lightningArtistData.frames[i].strokes.length; j++) {
                pointCount += lightningArtistData.frames[i].strokes[j].points.length;
            }
        }
        var firstPoint = lightningArtistData.frames[0].strokes[0].points[0].co[0] * 100;

        console.log("***********************");
        console.log("~INPUT~")
        console.log("total frames: " + frameCount);
        console.log("total strokes: " + strokeCount);
        console.log("total points: " + pointCount);
        console.log("first point: " + firstPoint);
        console.log("***********************");

        for (var i=0; i<lightningArtistData.frames.length; i++) { // frame
            strokeX = [];
            strokeY = [];
            strokeZ = [];
            strokeColors = [];
            for (var j=0; j<lightningArtistData.frames[i].strokes.length; j++) { // stroke 
                var bufferX = new ArrayBuffer(lightningArtistData.frames[i].strokes[j].points.length * 4);
                var bufferY = new ArrayBuffer(lightningArtistData.frames[i].strokes[j].points.length * 4);
                var bufferZ = new ArrayBuffer(lightningArtistData.frames[i].strokes[j].points.length * 4);
                
                var bufferXf = new Float32Array(bufferX);
                var bufferYf = new Float32Array(bufferY);
                var bufferZf = new Float32Array(bufferZ);
                
                for (var l=0; l<lightningArtistData.frames[i].strokes[j].points.length; l++) { // point
                    bufferXf[l] = (lightningArtistData.frames[i].strokes[j].points[l].co[0] * laScale) + laOffset.x;
                    bufferYf[l] = (lightningArtistData.frames[i].strokes[j].points[l].co[1] * laScale) + laOffset.y;
                    bufferZf[l] = (lightningArtistData.frames[i].strokes[j].points[l].co[2] * laScale) + laOffset.z;
                }

                strokeX.push(bufferXf);
                strokeY.push(bufferYf);
                strokeZ.push(bufferZf);
                strokeColors.push(lightningArtistData.frames[i].strokes[j].color);
            }

            frameX.push(strokeX);
            frameY.push(strokeY);
            frameZ.push(strokeZ);
            frameColors.push(strokeColors);
        }

        console.log("* * * color check: " + frameX.length + " " + frameColors.length + " " + frameX[0].length + " " + frameColors[0].length);

        frames = [];

        var oldStrokes = [];

        var texture = THREE.ImageUtils.loadTexture(brushPath);
        /*
        var exampleMaterial = new THREE.MeshLineMaterial( { 
            map: THREE.ImageUtils.loadTexture( 'assets/stroke.png' ),
            useMap: false,
            color: new THREE.Color( colors[ 3 ] ),
            opacity: .5,
            resolution: resolution,
            sizeAttenuation: false,
            lineWidth: 10,
            near: camera.near,
            far: camera.far,
            depthWrite: false,
            depthTest: false,
            transparent: true
        });
        */
        var special_mtl = new THREE.MeshLineMaterial({
            useMap: 1,
            map: texture,
            transparent: true,
            color: new THREE.Color(0xaaaaff),
            //sizeAttenuation: false,
            opacity: 0.85, 
            lineWidth: 0.5,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending
            /*
            blending: THREE[blending],
            blendSrc: THREE[blendSrc[4]],
            blendDst: THREE[blendDst[1]],
            blendEquation: THREE.AddEquation
            */
        });

        for (var i=0; i<frameX.length; i++) {
            var strokes = [];
            for (var j=0; j<frameX[i].length; j++) {
                var geometry = new THREE.Geometry();
                geometry.dynamic = true;
                
                var origVerts = [];

                for (var l=0; l<frameX[i][j].length; l++) {
                    origVerts.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));

                    if (l === 0 || !useMinDistance || (useMinDistance && origVerts[l].distanceTo(origVerts[l-1]) > minDistance)) {

                //for (var l=0; l<frameX[i][j].length; l++) {
                    //geometry.vertices.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                        geometry.vertices.push(origVerts[l]);
                    //line.positions.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                    }
                }
                geometry.verticesNeedUpdate = true;

                var line = new THREE.MeshLine();
                line.setGeometry(geometry);
                //var meshLine = new THREE.Mesh(line.geometry, special_mtl);
                var meshLine = new THREE.Mesh(line.geometry, new THREE.MeshLineMaterial({
                    useMap: 1,
                    map: texture,
                    transparent: true,
                    color: new THREE.Color(frameColors[i][j][0], frameColors[i][j][1], frameColors[i][j][2]),
                    //sizeAttenuation: false,
                    opacity: 0.85, 
                    lineWidth: 0.5,
                    depthWrite: false,
                    depthTest: false,
                    blending: THREE.AdditiveBlending
                    /*
                    blending: THREE[blending],
                    blendSrc: THREE[blendSrc[4]],
                    blendDst: THREE[blendDst[1]],
                    blendEquation: THREE.AddEquation
                    */
                }));
                //scene.add(meshLine); // check if this is OK
                //rotateAroundWorldAxis(meshLine, new THREE.Vector3(1,0,0), laRot.y * Math.PI/180); 
                //rotateAroundWorldAxis(meshLine, new THREE.Vector3(0,1,0), laRot.x * Math.PI/180); 
                strokes.push(meshLine);//line);
            }
            if (strokes.length !== 0) {
                oldStrokes = strokes;
                frames.push(strokes);  
            } else if (strokes.length === 0 && oldStrokes) {
                frames.push(oldStrokes);
            }            
        }

        if (useAudioSync) {
            Tone.Buffer.on("load", function(){
                player.loop = true;
                player.loopStart = 0;
                player.loopEnd = frames.length * frameInterval;
                player.sync();
                Tone.Transport.start();
                
                Tone.Transport.scheduleRepeat(function(time){
                        frameDelta = frameInterval;
                }, frameInterval);

                scheduleSubtitles();
            });
        }
            
        animate(performance ? performance.now() : Date.now());
    });

    function animate(timestamp) {
        if (armFrameForward) {
            armFrameForward = false;
            pauseAnimation = true;
            frameForward();
            console.log("ff: " + counter);
        }
        if (armFrameBack) {
            armFrameBack = false;
            pauseAnimation = true;
            frameBack();
            console.log("rew: " + counter);
        }
        if (armTogglePause) {
            pauseAnimation = !pauseAnimation;
            console.log("pause: " + pauseAnimation);
            armTogglePause = false;
        }

    	if (!pauseAnimation) {
	        if (!useAudioSync && !hidden) {
	            pTime = time;
	            time = new Date().getTime() / 1000;
	            frameDelta += time - pTime;
	        } else if (useAudioSync && !hidden) {
	            if (textMesh) textMesh.lookAt(camera);
	        }

	        if (frameDelta >= frameInterval) {
	            frameDelta = 0;

                frameMain();
	        }
        }

	    if (armSaveJson) {
        	armSaveJson = false;
        	pauseAnimation = true;
        	writeJson();
        } 	

        render(timestamp);
        requestAnimationFrame(animate);
    }

    function redrawFrame() {
        clearFrame();
        refreshFrame();
    }

    function clearFrame() {
        for (var i=scene.children.length; i>=0; i--) {
            if (scene.children[i] !== camera && scene.children[i] !== textMesh  && scene.children[i] !== room) {
                scene.remove(scene.children[i]);
            }
        }
    }

    function refreshFrame() {
        for (var i=0; i<frames[counter].length; i++) {
            scene.add(frames[counter][i]);
        }
    }

    function frameMain() {
        redrawFrame();
        counter++;
        if (counter >= frames.length - 1) {
            counter = 0;
            loopCounter++;
            subsCounter = 0;
            scheduleSubtitles();
        }
    }

    function frameForward() {
        counter++;
        if (counter >= frames.length - 1) counter = 0;
        redrawFrame();
    }

    function frameBack() {
        counter--;
        if (counter <= 0) counter = frames.length - 1;
        redrawFrame();
    }

    function loadJSON(filepath, callback) { 
        // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript  
        //var filepath = animationPath;
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', filepath, true);
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);  
    }

    // http://stackoverflow.com/questions/11119753/how-to-rotate-a-object-on-axis-world-three-js
    // http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
    // example:
    // rotateAroundWorldAxis(cube, new THREE.Vector3(1,0,0), 30 * Math.PI/180);     
    
    function rotateAroundObjectAxis(object, axis, radians) {
        var rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    function rotateAroundWorldAxis(object, axis, radians) {
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
        rotWorldMatrix.multiply(object.matrix);                // pre-multiply
        object.matrix = rotWorldMatrix;
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    function createText(_text) {
        if (textMesh) scene.remove(textMesh);
        
        var textGeo = new THREE.TextGeometry(_text, {
            size: 200,
            height: 1,
            curveSegments: 12,

            font: "helvetiker",
            weight: "bold",
            style: "normal",

            bevelThickness: 2,
            bevelSize: 5,
            bevelEnabled: false
        });

        textGeo.computeBoundingBox();
        var centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

        textMesh = new THREE.Mesh(textGeo, text_mtl);
        textMesh.castShadow = false;
        textMesh.receiveShadow = false;

        textMesh.position.set(centerOffset + 1300, -1200, -2800);

        scene.add(textMesh);
    }

    function doSubtitle(_frame) {
        Tone.Transport.scheduleOnce(function(time){
            createText(subtitlesArray[subsCounter]);
            subsCounter++;
        }, getLoopFrame(_frame));
    }

    function clearSubtitle(_frame) {
        Tone.Transport.scheduleOnce(function(time){
            if (textMesh) scene.remove(textMesh);
        }, getLoopFrame(_frame));
    }

    function getLoopFrame(_frame) {
        return ((loopCounter * (frames.length - 1)) + (_frame + subsFrameOffset)) * frameInterval;
    }

    function scheduleSubtitles() {
        doSubtitle(1);
        doSubtitle(20);
        doSubtitle(52);
        clearSubtitle(67);
        doSubtitle(71);
        clearSubtitle(93);
        /*
        doSubtitle(100);
        doSubtitle(133);
        doSubtitle(170);
        doSubtitle(191);
        doSubtitle(232);
        doSubtitle(254);
        doSubtitle(302);
        clearSubtitle(333);
        doSubtitle(347);
        clearSubtitle(377);
        doSubtitle(391);
        doSubtitle(429);
        doSubtitle(449);
        doSubtitle(463);
        doSubtitle(487);
        clearSubtitle(533);
        doSubtitle(538);
        doSubtitle(545);
        clearSubtitle(555);
        doSubtitle(557);
        doSubtitle(574);
        clearSubtitle(600);
        doSubtitle(607);
        doSubtitle(646);
        doSubtitle(672);
        doSubtitle(698);
        doSubtitle(721);
        doSubtitle(746);
        doSubtitle(763);
        doSubtitle(801);
        doSubtitle(822);
        */
    }

    function roundVal(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    } 

    function writeJson() {
    	var frameCount = frames.length;
    	var strokeCount = 0;
    	var pointCount = 0;
    	// http://stackoverflow.com/questions/35370483/geometries-on-vertex-of-buffergeometry-in-three-js
    	var firstPoint = frames[0][0].geometry.attributes.position.array[0];
    	for (var i=0; i<frames.length; i++) {
    		strokeCount += frames[i].length;
    		for (var j=0; j<frames[i].length; j++) {
    			//pointCount += frames[i][j].geometry.attributes.position.count;
                for (var l=0; l<frames[i][j].geometry.attributes.position.array.length; l += 6) {//l += 2) {
                    pointCount++;
                }
    		}
    	}
    	console.log("***********************");
        console.log("~OUTPUT~")
    	console.log("total frames: " + frameCount);
    	console.log("total strokes: " + strokeCount);
    	console.log("total points: " + pointCount);
    	console.log("first point: " + firstPoint);
    	console.log("***********************");

        var useScaleAndOffset = true;
        var globalScale = new THREE.Vector3(0.01, 0.01, 0.01);
        var globalOffset = new THREE.Vector3(0, 0, 0);

	    var sg = "{" + "\n";
	    sg += "    \"creator\": \"webvr\"," + "\n";
	    sg += "    \"grease_pencil\": [" + "\n";
	    sg += "        {" + "\n";
	    sg += "            \"layers\": [" + "\n";
	    var sl = "";
	    for (var f=0; f<1; f++) {// gp.layers.length, f++) { // TODO implement layers
	        var sb = "";
	        var layer = 0; //gp.layers[f] // TODO implement layers
	        for (var h=0; h<frames.length; h++) { //layer.frames.length, h++) { // TODO implement layers
	            var currentFrame = h;
	            sb += "                        {" + "\n"; // one frame
	            sb += "                            \"strokes\": [" + "\n";
	            sb += "                                {" + "\n"; // one stroke
	            for (var i=0; i<frames[currentFrame].length; i++) { //layer.frames[currentFrame].strokes.length) { // TODO implement layers
	                // TODO implement color
	                var color = [0,0,0];
	                //try {
	                   //color = frames[currentFrame].strokes[i].color.color; //layer.frames[currentFrame].strokes[i].color.color // TODO implement layers
	                //} catch (e) {
	                	//
	                //}
	                sb += "                                    \"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "]," + "\n";
	                sb += "                                    \"points\": [" + "\n";
	                for (var j=0; j<frames[currentFrame][i].geometry.attributes.position.array.length; j += 6 ) { //layer.frames[currentFrame].strokes[i].points.length) { // TODO implement layers
	                    var x = 0.0;
	                    var y = 0.0;
	                    var z = 0.0;

                        var point = new THREE.Vector3(frames[currentFrame][i].geometry.attributes.position.array[j], frames[currentFrame][i].geometry.attributes.position.array[j+1], frames[currentFrame][i].geometry.attributes.position.array[j+2]);

	                    //~
	                    //var point = frames[currentFrame][i].geometry.attributes.position[j]; //layer.frames[currentFrame].strokes[i].points[j].co // TODO implement layers
	                    if (useScaleAndOffset) {
	                        x = (point.x * globalScale.x) + globalOffset.x
	                        y = (point.y * globalScale.y) + globalOffset.y
	                        z = (point.z * globalScale.z) + globalOffset.z
	                    } else {
	                        x = point.x;
	                        y = point.y;
	                        z = point.z;
	                        //console.log(x + " " + y + " " + z);
	                    }
	                    //~
	                    if (roundValues) {
	                        sb += "                                        {\"co\": [" + roundVal(x, numPlaces) + ", " + roundVal(y, numPlaces) + ", " + roundVal(z, numPlaces) + "]";
	                    } else {
	                        sb += "                                        {\"co\": [" + x + ", " + z + ", " + y + "]";                  
	                    }
	                    //~
	                    if (j >= frames[currentFrame][i].geometry.attributes.position.array.length - 6) {  //layer.frames[currentFrame].strokes[i].points.length - 1) { // TODO implement layers
	                        sb += "}" + "\n";
	                        sb += "                                    ]" + "\n";
	                        if (i == frames[currentFrame].length - 1) { //layer.frames[currentFrame].strokes.length - 1) { // TODO implement layers
	                            sb += "                                }" + "\n"; // last stroke for this frame
	                        } else {
	                            sb += "                                }," + "\n"; // end stroke
	                            sb += "                                {" + "\n"; // begin stroke
	                    	}
	                    } else {
	                        sb += "}," + "\n";
	                    }
	                }
	                if (i == frames[currentFrame].length - 1) { //layer.frames[currentFrame].strokes.length - 1) { // TODO implement layers
	                    sb += "                            ]" + "\n";
	                }
	            }
	            if (h == frames.length - 1) { //layer.frames.length - 1) { // TODO implement layers
	                sb += "                        }" + "\n";
	            } else {
	                sb += "                        }," + "\n";
	            }
	        }
	        //~
	        var sf = "                {" + "\n";
	        sf += "                    \"name\": \"" + "WebVR Layer" + "\"," + "\n"; //layer.info + "\"," + "\n" // TODO implement layers
	        sf += "                    \"frames\": [" + "\n" + sb + "                    ]" + "\n";
	        if (f == 0) { //gp.layers.length-1) { // TODO implement layers
	            sf += "                }" + "\n";
	        } else {
	            sf += "                }," + "\n";
	        }
	        sl += sf;
	        //~
	    }
	    sg += sl;
	    sg += "            ]" + "\n";
	    sg += "        }"+ "\n";
	    sg += "    ]"+ "\n";
	    sg += "}"+ "\n";

	    var uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(sg);
	    pauseAnimation = false;
  		window.open(uriContent);
	}

}

window.onload = main;
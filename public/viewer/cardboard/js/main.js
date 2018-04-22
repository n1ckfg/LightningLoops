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
    var laOffset = new THREE.Vector3(0, 0, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
    var laRot = new THREE.Vector3(0, 0, 0);//145, 10, 0);
    var subsCounter = 0;
    var subsFrameOffset = 44;
    var fps = 12.0;
    var frameInterval = (1.0/fps);// * 1000;
    var frameDelta = 0;
    var time = 0;
    var pTime = 0;
    var pauseAnimation = false;

    // ~ ~ ~ 
    //var line_mtl, red_mtl, text_mtl;
    var subtitleText, readingText;
    var texture;

    // http://threejs.org/examples/webgl_materials_blending_custom.html
    //var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
    //var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
    //var blending = "CustomBlending";

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

    /*
    line_mtl = new THREE.MeshLineMaterial();

    text_mtl = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: true 
    });

    red_mtl = line_mtl;
    */
    //red_mtl.color.setHex(0xffaaaa);
    // ~ ~ ~ 

    /*
    var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];
    var strokeColors = [];
    var frameColors = [];
    var frames = [];
    var counter = 0;
    var loopCounter = 0;
    */

    var layers = [];

    class Layer {
        constructor() {
            this.name = "";
            this.strokeX = [];
            this.strokeY = [];
            this.strokeZ = [];
            this.frameX = [];
            this.frameY = [];
            this.frameZ = [];
            this.strokeColors = [];
            this.frameColors = [];
            this.frames = [];
            this.counter = 0;
            this.loopCounter = 0;
        }
    }

    var palette = [];
    var defaultColor = [0.667, 0.667, 1];
    var minDistance = 0.01;
    var useMinDistance = false;
    var roundValues = true;
    var numPlaces = 7;

    var useAudioSync = false;
    var soundPath = "../../sounds/avlt.mp3";
    var animationPath = "../../animations/jellyfish.json";
    var brushPath = "../../images/brush_cardboard.png";

    init();
    showReading();

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
        //lightningArtistData = JSON.parse(response).grease_pencil[0].layers[0];
        jsonToGp(JSON.parse(response).grease_pencil[0]);
    });

    function jsonToGp(lightningArtistData) {
        for (var h=0; h<lightningArtistData.layers.length; h++) {
            // ~ ~ ~
            var layer = new Layer();
            if (lightningArtistData.layers[h].name != null) {
                layer.name = lightningArtistData.layers[h].name;
            } else {
                layer.name = "WebVR Layer " + (h+1);
            }
            var frameCount = lightningArtistData.layers[h].frames.length;
            var strokeCount = 0;
            var pointCount = 0;
            for (var i=0; i<lightningArtistData.layers[h].frames.length; i++) {
                strokeCount += lightningArtistData.layers[h].frames[i].strokes.length;
                for (var j=0; j<lightningArtistData.layers[h].frames[i].strokes.length; j++) {
                    pointCount += lightningArtistData.layers[h].frames[i].strokes[j].points.length;
                }
            }
            var firstPoint = "*";
            try {
                firstPoint = lightningArtistData.layers[h].frames[0].strokes[0].points[0].co[0] * 100;
            } catch (e) {
                //
            }

            console.log("***********************");
            console.log("~INPUT~")
            console.log("total frames: " + frameCount);
            console.log("total strokes: " + strokeCount);
            console.log("total points: " + pointCount);
            console.log("first point: " + firstPoint);
            console.log("***********************");

            for (var i=0; i<lightningArtistData.layers[h].frames.length; i++) { // frame
                layer.strokeX = [];
                layer.strokeY = [];
                layer.strokeZ = [];
                layer.strokeColors = [];
                for (var j=0; j<lightningArtistData.layers[h].frames[i].strokes.length; j++) { // stroke 
                    var bufferX = new ArrayBuffer(lightningArtistData.layers[h].frames[i].strokes[j].points.length * 4);
                    var bufferY = new ArrayBuffer(lightningArtistData.layers[h].frames[i].strokes[j].points.length * 4);
                    var bufferZ = new ArrayBuffer(lightningArtistData.layers[h].frames[i].strokes[j].points.length * 4);
                    
                    var bufferXf = new Float32Array(bufferX);
                    var bufferYf = new Float32Array(bufferY);
                    var bufferZf = new Float32Array(bufferZ);
                    
                    for (var l=0; l<lightningArtistData.layers[h].frames[i].strokes[j].points.length; l++) { // point
                        bufferXf[l] = (lightningArtistData.layers[h].frames[i].strokes[j].points[l].co[0] * laScale) + laOffset.x;
                        bufferYf[l] = (lightningArtistData.layers[h].frames[i].strokes[j].points[l].co[1] * laScale) + laOffset.y;
                        bufferZf[l] = (lightningArtistData.layers[h].frames[i].strokes[j].points[l].co[2] * laScale) + laOffset.z;
                    }

                    layer.strokeX.push(bufferXf);
                    layer.strokeY.push(bufferYf);
                    layer.strokeZ.push(bufferZf);
                    var newColor = defaultColor;
                    try {
                        newColor = lightningArtistData.layers[h].frames[i].strokes[j].color;
                    } catch (e) {
                        //
                    }
                    layer.strokeColors.push(newColor);
                }

                layer.frameX.push(layer.strokeX);
                layer.frameY.push(layer.strokeY);
                layer.frameZ.push(layer.strokeZ);
                layer.frameColors.push(layer.strokeColors);
            }

            console.log("* * * color check: " + layer.frameX.length + " " + layer.frameColors.length + " " + layer.frameX[0].length + " " + layer.frameColors[0].length);

            layer.frames = [];

            var oldStrokes = [];

            texture = THREE.ImageUtils.loadTexture(brushPath);
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

            var special_mtl = createMtl(defaultColor);

            for (var i=0; i<layer.frameX.length; i++) {
                var strokes = [];
                for (var j=0; j<layer.frameX[i].length; j++) {
                    var geometry = new THREE.Geometry();
                    geometry.dynamic = true;
                    
                    var origVerts = [];

                    for (var l=0; l<layer.frameX[i][j].length; l++) {
                        origVerts.push(new THREE.Vector3(layer.frameX[i][j][l], layer.frameY[i][j][l], layer.frameZ[i][j][l]));

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
                    var meshLine = new THREE.Mesh(line.geometry, createUniqueMtl([layer.frameColors[i][j][0], layer.frameColors[i][j][1], layer.frameColors[i][j][2]]));
                    //scene.add(meshLine); // check if this is OK
                    //rotateAroundWorldAxis(meshLine, new THREE.Vector3(1,0,0), laRot.y * Math.PI/180); 
                    //rotateAroundWorldAxis(meshLine, new THREE.Vector3(0,1,0), laRot.x * Math.PI/180); 
                    strokes.push(meshLine);//line);
                }
                if (strokes.length !== 0) {
                    oldStrokes = strokes;
                    layer.frames.push(strokes);  
                } else if (strokes.length === 0 && oldStrokes) {
                    layer.frames.push(oldStrokes);
                }            
            }
            // ~ ~ ~ 
            layers.push(layer);
        }

        if (useAudioSync) {
            Tone.Buffer.on("load", function(){
                player.loop = true;
                player.loopStart = 0;
                //player.loopEnd = frames.length * frameInterval;
                player.loopEnd = layers[getLongestLayer()].frames.length * frameInterval;
                player.sync();
                Tone.Transport.start();
                
                Tone.Transport.scheduleRepeat(function(time){
                        frameDelta = frameInterval;
                }, frameInterval);

                scheduleSubtitles();
            });
        }
   
        animate(performance ? performance.now() : Date.now());
    }

    function getLongestLayer() {
        var returns = 0;
        for (var h=0; h<layers.length; h++) {
            if (layers[h].frames.length > returns) returns = h;
        }
        return returns;
    }

    function animate(timestamp) {
        if (armFrameForward) {
            armFrameForward = false;
            pauseAnimation = true;
            frameForward();
            console.log("ff: " + layer[getLongestLayer()].counter);
        }
        if (armFrameBack) {
            armFrameBack = false;
            pauseAnimation = true;
            frameBack();
            console.log("rew: " + layer[getLongestLayer()].counter);
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
	            if (subtitleText) subtitleText.lookAt(camera);
	        }

	        if (frameDelta >= frameInterval) {
	            frameDelta = 0;

                frameMain();
	        }
        }

	    if (armSaveJson) {
        	armSaveJson = false;
        	//pauseAnimation = true;
        	writeJson();
        } 	

        render(timestamp);
        requestAnimationFrame(animate);
    }

    function redrawFrame(index) {
        if (index === 0) clearFrame();
        refreshFrame(index);
    }

    function clearFrame() {
        for (var i=scene.children.length; i>=0; i--) {
            if (scene.children[i] !== camera && scene.children[i] !== subtitleText  && scene.children[i] !== room) {
                scene.remove(scene.children[i]);
            }
        }
    }

    function refreshFrame(index) {
        for (var i=0; i<layers[index].frames[layers[index].counter].length; i++) {
            scene.add(layers[index].frames[layers[index].counter][i]);
        }
    }

    function frameMain() {
        for (var h=0; h<layers.length; h++) {
            redrawFrame(h);
            layers[h].counter++;
            if (layers[h].counter >= layers[h].frames.length - 1) {
                layers[h].counter = 0;
                layers[h].loopCounter++;
                
                if (h == getLongestLayer()) {
                    subsCounter = 0;
                    scheduleSubtitles();
                }
            }
        }
    }

    function frameForward() {
        for (var h=0; h<layers.length; h++) {        
            layers[h].counter++;
            if (layers[h].counter >= layers[h].frames.length - 1) layers[h].counter = 0;
            redrawFrame(h);
        }
    }

    function frameBack() {
        for (var h=0; h<layers.length; h++) {        
            layers[h].counter--;
            if (layers[h].counter <= 0) layers[h].counter = layers[h].frames.length - 1;
            redrawFrame(h);
        }
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

    function createText(_text, x, y, z) {
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

        var textMesh = new THREE.Mesh(textGeo, text_mtl);
        textMesh.castShadow = false;
        textMesh.receiveShadow = false;

        textMesh.position.set(centerOffset + x, y, z);

        scene.add(textMesh);
        textMesh.parent = camera;
        textMesh.lookAt(camera);
        return textMesh;
    }


    function doSubtitle(_frame) {
        Tone.Transport.scheduleOnce(function(time){
            subtitleText = createText(subtitlesArray[subsCounter], 1300, -1200, -2800);
            subsCounter++;
        }, getLoopFrame(_frame));
    }

    function clearSubtitle(_frame) {
        Tone.Transport.scheduleOnce(function(time){
            if (subtitleText) scene.remove(subtitleText);
        }, getLoopFrame(_frame));
    }

    function getLoopFrame(_frame) {
        //return ((loopCounter * (frames.length - 1)) + (_frame + subsFrameOffset)) * frameInterval;
        return ((layers[getLongestLayer()].loopCounter * (layers[getLongestLayer()].frames.length - 1)) + (_frame + subsFrameOffset)) * frameInterval;
    }

    function showReading() {
        readingText = createText("READING...", 0, 0, -2000);//1300, -1200, -2800);
        //readingText.lookAt(camera);
        render(0);
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
    	var frameCount = layers[getLongestLayer()].frames.length;
    	var strokeCount = 0;
    	var pointCount = 0;
    	// http://stackoverflow.com/questions/35370483/geometries-on-vertex-of-buffergeometry-in-three-js
    	var firstPoint = layers[getLongestLayer()].frames[0][0].geometry.attributes.position.array[0];
        for (var h=0; h<layers.length; h++) {
        	for (var i=0; i<layers[h].frames.length; i++) {
        		strokeCount += layers[h].frames[i].length;
        		for (var j=0; j<layers[h].frames[i].length; j++) {
        			//pointCount += frames[i][j].geometry.attributes.position.count;
                    for (var l=0; l<layers[h].frames[i][j].geometry.attributes.position.array.length; l += 6) {//l += 2) {
                        pointCount++;
                    }
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
	    for (var f=0; f<layers.length; f++) {// gp.layers.length, f++) { 
	        var sb = "";
	        var layer = layers[f]; //gp.layers[f] 
	        for (var h=0; h<layer.frames.length; h++) { //layer.frames.length, h++) { 
	            var currentFrame = h;
	            sb += "                        {" + "\n"; // one frame
	            sb += "                            \"strokes\": [" + "\n";
	            if (layer.frames[currentFrame].length > 0) {
                    sb += "                                {" + "\n"; // one stroke
                } else {
                    sb += "                            ]" + "\n"; // no strokes
                }
	            for (var i=0; i<layer.frames[currentFrame].length; i++) { //layer.frames[currentFrame].strokes.length) { 
	                var color = defaultColor;
	                try {
                       //color = frames[currentFrame].strokes[i].color.color; //layer.frames[currentFrame].strokes[i].color.color 
                       color = [layer.frameColors[currentFrame][i][0], layer.frameColors[currentFrame][i][1], layer.frameColors[currentFrame][i][2]];
	                } catch (e) {
	                	//
	                }
	                sb += "                                    \"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "]," + "\n";
	                sb += "                                    \"points\": [" + "\n";
	                for (var j=0; j<layer.frames[currentFrame][i].geometry.attributes.position.array.length; j += 6 ) { //layer.frames[currentFrame].strokes[i].points.length) { 
	                    var x = 0.0;
	                    var y = 0.0;
	                    var z = 0.0;

                        var point = new THREE.Vector3(layer.frames[currentFrame][i].geometry.attributes.position.array[j], layer.frames[currentFrame][i].geometry.attributes.position.array[j+1], layer.frames[currentFrame][i].geometry.attributes.position.array[j+2]);

	                    //~
	                    //var point = frames[currentFrame][i].geometry.attributes.position[j]; //layer.frames[currentFrame].strokes[i].points[j].co 
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
	                    if (j >= layer.frames[currentFrame][i].geometry.attributes.position.array.length - 6) {  //layer.frames[currentFrame].strokes[i].points.length - 1) { 
	                        sb += "}" + "\n";
	                        sb += "                                    ]" + "\n";
	                        if (i == layer.frames[currentFrame].length - 1) { //layer.frames[currentFrame].strokes.length - 1) { 
	                            sb += "                                }" + "\n"; // last stroke for this frame
	                        } else {
	                            sb += "                                }," + "\n"; // end stroke
	                            sb += "                                {" + "\n"; // begin stroke
	                    	}
	                    } else {
	                        sb += "}," + "\n";
	                    }
	                }
	                if (i == layer.frames[currentFrame].length - 1) { //layer.frames[currentFrame].strokes.length - 1) { 
	                    sb += "                            ]" + "\n";
	                }
	            }
	            if (h == layer.frames.length - 1) { //layer.frames.length - 1) { 
	                sb += "                        }" + "\n";
	            } else {
	                sb += "                        }," + "\n";
	            }
	        }
	        //~
	        var sf = "                {" + "\n";
	        sf += "                    \"name\": \"" + layer.name + "\"," + "\n"; //layer.info + "\"," + "\n" 
	        sf += "                    \"frames\": [" + "\n" + sb + "                    ]" + "\n";
	        if (f == layers.length-1) { //gp.layers.length-1) { 
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
	    //pauseAnimation = false;
  		window.open(uriContent);
	}

    // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

    //var dropZone = document.getElementById('dropZone');
    var dropZone = document.getElementsByTagName("body")[0];

    // Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
    dropZone.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    // Get file data on drop
    dropZone.addEventListener('drop', function(e) {
        showReading();

        e.stopPropagation();
        e.preventDefault();
        var files = e.dataTransfer.files; // Array of all files
        for (var i=0, file; file=files[i]; i++) {
            var reader = new FileReader();
            //if (file.type.match(/image.*/)) {
                //reader.onload = function(e2) { // finished reading file data.
                    //var img = document.createElement('img');
                    //img.src= e2.target.result;
                    //document.body.appendChild(img);
                //}
                //reader.readAsDataURL(file); // start reading the file data.
            //} else {
            reader.onload = function(e2) {
                //console.log(e2.target.result);
                pauseAnimation = true;
                clearFrame();
                /*
                strokeX = [];
                strokeY = [];
                strokeZ = [];
                frameX = [];
                frameY = [];
                frameZ = [];
                strokeColors = [];
                frameColors = [];
                frames = [];
                palette = [];
                counter = 0;
                loopCounter = 0;
                */
                subsCounter = 0;
                layers = [];
                jsonToGp(JSON.parse(e2.target.result).grease_pencil[0]);
                pauseAnimation = false;
            }
            reader.readAsText(file, 'UTF-8');
            //}   
        }   
    });

    // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
/*
def searchMtl(color=None, name="crv"):
returns = []
if not color:
    color = getActiveColor().color
curves = matchName(name)
for curve in curves:
    if (compareTuple(curve.data.materials[0].diffuse_color, color)):
        returns.append(curve)
#print ("found: " + str(returns))
return returns

def changeMtl(color=(1,1,0), searchColor=None, name="crv"):
    if not searchColor:
        searchColor = getActiveColor().color       
    curves = searchMtl(color=searchColor, name=name)
    print("changed: " + str(curves))
    for curve in curves:
        curve.data.materials[0].diffuse_color = color

def consolidateMtl(name="crv"):
    palette = getActivePalette()
    for color in palette.colors:
        curves = searchMtl(color=color.color, name=name)
        for i in range(1, len(curves)):
            curves[i].data.materials[0] = curves[0].data.materials[0]    

def createColor(_color):
    frame = getActiveFrame()
    palette = getActivePalette()
    matchingColorIndex = -1
    places = 7
    for i in range(0, len(palette.colors)):
        if (roundVal(_color[0], places) == roundVal(palette.colors[i].color.r, places) and roundVal(_color[1], places) == roundVal(palette.colors[i].color.g, places) and roundVal(_color[2], places) == roundVal(palette.colors[i].color.b, places)):
            matchingColorIndex = i
    #~
    if (matchingColorIndex == -1):
        color = palette.colors.new()
        color.color = _color
    else:
        palette.colors.active = palette.colors[matchingColorIndex]
        color = palette.colors[matchingColorIndex]
    #~        
    print("Active color is: " + "\"" + palette.colors.active.name + "\" " + str(palette.colors.active.color))
    return color
*/

    function createMtl(color) {
    	var mtl = new THREE.MeshLineMaterial({
            useMap: 1,
            map: texture,
            transparent: true,
            color: new THREE.Color(color[0],color[1],color[2]),
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
    	return mtl;
    }

	function createUniqueMtl(color) {
		var mtlIndex = -1;
		for (var i=0; i<palette.length; i++) {
			var paletteColor = [palette[i].uniforms.color.value.r, palette[i].uniforms.color.value.g, palette[i].uniforms.color.value.b];
			//console.log(paletteColor);
			if (compareColor(color, paletteColor, 5)) {
				mtlIndex = i;
				console.log("Found palette match at index " + i);
				break;
			}
		}
		if (mtlIndex === -1) {
			var mtl = createMtl(color);
			palette.push(mtl);
			return palette[palette.length-1];
			console.log("Creating new color, " + palette.length + " total colors");
		} else {
			console.log("Reusing color " + mtlIndex + ", " + palette.length + " total colors");
			return palette[mtlIndex];
		}
	}

    function compareColor(c1, c2, numPlaces) {
    	//console.log(c1 + " " + c2);
        var r1 = roundVal(c1[0], numPlaces);
        var r2 = roundVal(c2[0], numPlaces);
        var g1 = roundVal(c1[1], numPlaces);
        var g2 = roundVal(c2[1], numPlaces);
        var b1 = roundVal(c1[2], numPlaces);
        var b2 = roundVal(c2[2], numPlaces);
        if (r1 === r2 && g1 === g2 && b1 === b2) {
            return true;
        } else {
            return false;
        }
    }

}

window.onload = main;
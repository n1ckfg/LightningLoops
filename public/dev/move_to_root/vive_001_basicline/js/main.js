
"use strict";

// https://github.com/mrdoob/three.js/wiki/Drawing-lines
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html

function main() {

    var hidden = false;
    var lightningArtistData;
    //var laScale = 10;
    //var laOffset = new THREE.Vector3(0, -1.5, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
    //var laRot = new THREE.Vector3(300, 0, 0);//145, 10, 0);
    var counter = 0;
    var loopCounter = 0;
    var subsCounter = 0;
    var subsFrameOffset = 44;
    var fps = 12.0;
    var frameInterval = (1.0/fps);// * 1000;
    var frameDelta = 0;
    var time = 0;
    var pTime = 0;

    // ~ ~ ~ 
    //var line_mtl, red_mtl, text_mtl;
    var textMesh;

    // http://threejs.org/examples/webgl_materials_blending_custom.html
    //var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
    //var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
    //var blending = "CustomBlending";

    /*
	line_mtl = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,//999fff,
        opacity: 0.5,
        linewidth: 3,
        transparent: true,
        blending: THREE[blending],
        blendSrc: THREE[blendSrc[4]],
        blendDst: THREE[blendDst[1]],
        blendEquation: THREE.AddEquation
    });

    text_mtl = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: true 
    });

    red_mtl = line_mtl;
    red_mtl.color.setHex(0xaaaaff);
	*/
    // ~ ~ ~ 

    var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];
    var frames = [];

    var useAudioSync = false;
    var soundPath = "../sounds/avlt.ogg";
    var animationPath = "../animations/current.json";

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

    init();

    loadJSON(animationPath, function(response) {
        lightningArtistData = JSON.parse(response);

        for (var i=0; i<lightningArtistData.brushstrokes.length; i++) { // frame
            strokeX = [];
            strokeY = [];
            strokeZ = [];
            for (var j=0; j<lightningArtistData.brushstrokes[i].length; j++) { // stroke 
                var bufferX = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                var bufferY = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                var bufferZ = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                
                var bufferXf = new Float32Array(bufferX);
                var bufferYf = new Float32Array(bufferY);
                var bufferZf = new Float32Array(bufferZ);
                
                for (var l=0; l<lightningArtistData.brushstrokes[i][j].length; l++) { // point
                    bufferXf[l] = (lightningArtistData.brushstrokes[i][j][l].x * laScale) + laOffset.x;
                    bufferYf[l] = (lightningArtistData.brushstrokes[i][j][l].y * laScale) + laOffset.y;
                    bufferZf[l] = (lightningArtistData.brushstrokes[i][j][l].z * laScale) + laOffset.z;
                }

                strokeX.push(bufferXf);
                strokeY.push(bufferYf);
                strokeZ.push(bufferZf);
            }

            frameX.push(strokeX);
            frameY.push(strokeY);
            frameZ.push(strokeZ);
        }

        frames = [];

        var oldStrokes = [];

        for (var i=0; i<frameX.length; i++) {
            var strokes = [];
            for (var j=0; j<frameX[i].length; j++) {
                var geometry = new THREE.Geometry();
                var line = new THREE.Line(geometry, blue_mtl);
                line.geometry.dynamic = true;
                for (var l=0; l<frameX[i][j].length; l++) {
                    line.geometry.vertices.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                }
                line.geometry.verticesNeedUpdate = true;
                rotateAroundWorldAxis(line, new THREE.Vector3(1,0,0), laRot.y * Math.PI/180); 
                rotateAroundWorldAxis(line, new THREE.Vector3(0,1,0), laRot.x * Math.PI/180); 
                strokes.push(line);
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
            
        animate();
    });

    function animate() {
        if (!useAudioSync && !hidden) {
            pTime = time;
            time = new Date().getTime() / 1000;
            frameDelta += time - pTime;
        } else if (useAudioSync && !hidden) {
            if (textMesh) {
                textMesh.lookAt(camera);
                textMesh.rotation.set(0, -45, 0);
            }
        }

        if (frameDelta >= frameInterval) {
            frameDelta = 0;

            for (var i=scene.children.length; i>=0; i--) {
                if (scene.children[i] !== camera && scene.children[i] !== textMesh && scene.children[i] !== room && scene.children[i] !== controller1 && scene.children[i] !== controller2) {
                    scene.remove(scene.children[i]);
                }
            }

            for (var i=0; i<frames[counter].length; i++) {
                scene.add(frames[counter][i]);
            }

            counter++;
            if (counter > frames.length - 1) {
                counter = 0;
                loopCounter++;
                subsCounter = 0;
                scheduleSubtitles();
            }
        }

        updateControllers();
        render();
        requestAnimationFrame(animate);
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

        var scaler = 0.01
        centerOffset *= scaler;
        textMesh.scale.set(-scaler, scaler, scaler);
        textMesh.position.set(-20, -5, 20);
        //rotateAroundWorldAxis(textMesh, new THREE.Vector3(1,0,0), laRot.y * Math.PI/180); 
        //rotateAroundWorldAxis(textMesh, new THREE.Vector3(0,1,0), laRot.x * Math.PI/180); 

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

}

window.onload = main;
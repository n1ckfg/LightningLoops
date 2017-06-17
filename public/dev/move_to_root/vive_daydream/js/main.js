
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

    line_mtl = new THREE.MeshLineMaterial();

    text_mtl = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        depthTest: false,
        depthWrite: true 
    });

    red_mtl = line_mtl;

    // ~ ~ ~ 

    var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];
    var frames = [];
    var strokes = [];
    var strokeCounter = 0;
    var isDrawing = false;
	var isPlaying = true;
    var debugPos = false;
	var tempStroke;
	var tempStrokeGeometry;
	var tempPoints = [];
	var minDistance = 0.001;

    var useAudioSync = false;
    var soundPath = "../sounds/avlt.ogg";
    var animationPath = "../animations/current.json";
    var brushPath = "../images/brush_vive.png";

    var player = new Tone.Player({
        "url": soundPath
    }).toMaster();

	var c1b0_blocking = false;
	var c1b1_blocking = false;
	var c1b2_blocking = false;
	var c1b3_blocking = false;
	var c2b0_blocking = false;
	var c2b1_blocking = false;
	var c2b2_blocking = false;
	var c2b3_blocking = false;
	
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

    var special_mtl;

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
        special_mtl = new THREE.MeshLineMaterial({
            useMap: 1,
            map: texture,
            transparent: true,
            color: new THREE.Color(0xaaaaff),
            //sizeAttenuation: false,
            opacity: 0.75, 
            lineWidth: 0.05,
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
                /*
                for (var l=0; l<frameX[i][j].length; l++) {
                    geometry.vertices.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                }
                */
                var origVerts = [];

                for (var l=0; l<frameX[i][j].length; l++) {
                    origVerts.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));

                    if (l === 0 || origVerts[l].distanceTo(origVerts[l-1]) > minDistance) {

                //for (var l=0; l<frameX[i][j].length; l++) {
                    //geometry.vertices.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                        geometry.vertices.push(origVerts[l]);
                    //line.positions.push(new THREE.Vector3(frameX[i][j][l],frameY[i][j][l], frameZ[i][j][l]));
                    }
                }

                geometry.verticesNeedUpdate = true;
                
                var line = new THREE.MeshLine();
                line.setGeometry(geometry);
                var meshLine = new THREE.Mesh(line.geometry, special_mtl);
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
            
        animate();
    });

    function updateControllers() {
        if (gamepad1 !== undefined) {
            var pos = controller1.position.applyMatrix4(controller1.standingMatrix);
            if (debugPos) {
                console.log(
                "ctl1 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
                "ctl1 pad: "  + gamepad1.buttons[0].pressed + "\n" +
                "ctl1 trigger: "  + gamepad1.buttons[1].pressed + "\n" +
                "ctl1 grip: "  + gamepad1.buttons[2].pressed + "\n" +
                "ctl1 menu: "  + gamepad1.buttons[3].pressed
                );
            }
            // ~ ~ ~
            if (gamepad1.buttons[1].pressed && !isDrawing) {
                beginStroke(pos.x, pos.y, pos.z);
            } else if (gamepad1.buttons[1].pressed && isDrawing) {
                updateStroke(pos.x, pos.y, pos.z);
            } else if (!gamepad1.buttons[1].pressed && isDrawing) {
                endStroke();
            }
            
            /*
			if (gamepad1.buttons[0].pressed && strokes[2]) {
                var target = scene.getObjectByName(strokes[2].name);
                scene.remove(target);
            }
			*/
			
			if (gamepad1.buttons[0].pressed && !c1b0_blocking) {
				isPlaying = !isPlaying;
				c1b0_blocking = true;
				console.log("playing: " + isPlaying);
			} else if (!gamepad1.buttons[0].pressed && c1b0_blocking) {
				c1b0_blocking = false;
			}
			
			/*
            if (gamepad1.buttons[2].pressed && !c1b2_blocking) {
				isPlaying = false;
				frameChange(1);
				c1b2_blocking = true;
				console.log("frame forward " + counter);
			} else if (!gamepad1.buttons[2].pressed && c1b2_blocking) {
				c1b2_blocking = false;
			}
            */
        }
        if (gamepad2 !== undefined) {
            var pos = controller2.position.applyMatrix4(controller2.standingMatrix);
            if (debugPos) {
                console.log(
                "ctl2 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
                "ctl2 pad: "  + gamepad2.buttons[0].pressed + "\n" +
                "ctl2 trigger: "  + gamepad2.buttons[1].pressed + "\n" +
                "ctl2 grip: "  + gamepad2.buttons[2].pressed + "\n" +
                "ctl2 menu: "  + gamepad2.buttons[3].pressed
                );
            }
            // ~ ~ ~
			if (gamepad2.buttons[2].pressed && !c2b2_blocking) {
				isPlaying = false;
				frameChange(-1);
				c2b2_blocking = true;
				console.log("frame back " + counter);
			} else if (!gamepad2.buttons[2].pressed && c2b2_blocking) {
				c2b2_blocking = false;
			}
		}       
    }

    // ~ ~ ~ 
    function beginStroke(x, y, z) {
        isDrawing = true;
		isPlaying = false;
		tempPoints = [];
		//clearTempStroke();
		createTempStroke(x, y, z);
		console.log("Begin " + tempStroke.name + ".");
		
        /*
		var geometry = new THREE.Geometry();
        geometry.dynamic = true;
        var line = new THREE.MeshLine();
        //var line = new THREE.Line(geometry, red_mtl);
        line.setGeometry(geometry);
        var meshLine = new THREE.Mesh(line.geometry, special_mtl);
        meshLine.name = "stroke" + strokeCounter;
        strokes.push(meshLine);
        scene.add(strokes[strokeCounter]);
        addVertex(strokes[strokeCounter], x, y, z);

        console.log("Begin " + strokes[strokeCounter].name + ".");
		*/
    }
    
    function updateStroke(x, y, z) {
        /*
		addVertex(strokes[strokeCounter], x, y, z);
        strokes[strokeCounter].geometry.verticesNeedUpdate = true;
        console.log("Update " + strokes[strokeCounter].name + ": " + strokes[strokeCounter].geometry.vertices.length + " points.");
		*/
        var p = new THREE.Vector3(x, y, z);

		if (p.distanceTo(tempPoints[tempPoints.length-1]) > minDistance) {
            clearTempStroke();
		    createTempStroke(x, y, z);
		    console.log("Update " + tempStroke.name + ": " + tempStrokeGeometry.vertices.length + " points."); 
        }
    }
    
    /*
	function addVertex(obj, x, y, z) {
		obj.geometry.dynamic = true;
        obj.geometry.vertices.push(new THREE.Vector3(x, y, z));
        obj.geometry.verticesNeedUpdate = true;
        obj.geometry.__dirtyVertices = true; 
    }
	*/
	
	function endStroke() {
        //scene.add(strokes[strokeCounter]);
        isDrawing = false;
   		frames[counter].push(tempStroke);
		clearTempStroke();
		refreshFrame();
        console.log("End " + frames[counter][frames[counter].length-1].name + ".");
		strokeCounter++;
    }
	
	function addTempPoints(x, y, z) {
		tempPoints.push(new THREE.Vector3(x, y, z));
		tempStrokeGeometry = new THREE.Geometry();
		tempStrokeGeometry.dynamic = true;
		for (var i=0; i<tempPoints.length; i++) {
			tempStrokeGeometry.vertices.push(tempPoints[i]);
		}
        tempStrokeGeometry.verticesNeedUpdate = true;
        tempStrokeGeometry.__dirtyVertices = true; 
    }
    
	function createTempStroke(x, y , z) {
		addTempPoints(x, y, z);
        var line = new THREE.MeshLine();
        line.setGeometry(tempStrokeGeometry);
        tempStroke = new THREE.Mesh(line.geometry, special_mtl);
        tempStroke.name = "stroke" + strokeCounter;
        scene.add(tempStroke);
	}
    // ~ ~ ~ 
    
	function refreshFrame() {
		for (var i=0; i<frames[counter].length; i++) {
			scene.add(frames[counter][i]);
		}		
	}
	
	function clearFrame() {
		for (var i=scene.children.length; i>=0; i--) {
			if (scene.children[i] !== camera && scene.children[i] !== textMesh && scene.children[i] !== room && scene.children[i] !== controller1 && scene.children[i] !== controller2) {
				scene.remove(scene.children[i]);
			}
		}		
	}
	
	function clearTempStroke() {
		try {
			scene.remove(tempStroke);
			console.log("Removed temp stroke.")
		} catch (e) {
			//
		}		
	}
	
	function frameChange(index) {
		// TODO order correctly
		clearFrame();
		refreshFrame();
		counter += index;
		if (counter > frames.length - 1 || counter < 0) {
			if (counter > frames.length - 1) {
				counter = 0;
			} else if (counter < 0) {
				counter = frames.length - 1;
			}
			loopCounter++;
			subsCounter = 0;
			scheduleSubtitles();
		}		
	}
	
    function animate() {
		if (isPlaying) {
			if (!useAudioSync && !hidden) {
				pTime = time;
				time = new Date().getTime() / 1000;
				frameDelta += time - pTime;
			} else if (useAudioSync && !hidden) {
				/*
				if (textMesh) {
					textMesh.lookAt(camera);
					textMesh.rotation.set(0, -45, 0);
				}
				*/
			}

			if (frameDelta >= frameInterval) {
				frameDelta = 0;

				/*
				for (var i=scene.children.length; i>=0; i--) {
					if (scene.children[i] !== camera && scene.children[i] !== textMesh && scene.children[i] !== room && scene.children[i] !== controller1 && scene.children[i] !== controller2) {
						scene.remove(scene.children[i]);
					}
				}

				for (var i=0; i<frames[counter].length; i++) {
					scene.add(frames[counter][i]);
				}
				*/
				
				frameChange(1);
			}
		}

		if (useAudioSync && !hidden) {
			if (textMesh) {
				textMesh.lookAt(camera);
				textMesh.rotation.set(0, -45, 0);
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
"use strict";

var layers = [];
var soundPath = "../sounds/avlt.ogg";
var animationPath = "../animations/jellyfish.json";
var brushPath = "../images/brush_vive.png";
var player; // Tone.js
var viveMode = false;
var hidden = false;
var drawWhilePlaying = true;
var lightningArtistData;
var clicked = false;

var laScale = 10;
var laOffset = new THREE.Vector3(0, 0, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
var laRot = new THREE.Vector3(0, 0, 0);//145, 10, 0);

var useScaleAndOffset = true;
var globalScale = new THREE.Vector3(0.1, 0.1, 0.1);
var globalOffset = new THREE.Vector3(0, 0, 0);

var subsCounter = 0;
var subsFrameOffset = 44;
var fps = 12.0;
var frameInterval = (1.0/fps);// * 1000;
var frameDelta = 0;
var time = 0;
var pTime = 0;
var pauseAnimation = false;
var mouse3D = new THREE.Vector3(0, 0, 0);
// ~ ~ ~ 
var subtitleText, readingText;
var firstTextUse = true;
var texture;

// http://threejs.org/examples/webgl_materials_blending_custom.html
var blendSrc = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
var blendDst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
var blending = "CustomBlending";
	

var line_mtl = new THREE.MeshLineMaterial();

var text_mtl = new THREE.MeshBasicMaterial({ 
	color: 0xffff00,
	depthTest: false,
	depthWrite: true 
});

var latkDebug = false;

var defaultColor = [0.667, 0.667, 1];
var serverColor = [1, 0.5, 0.25];
var defaultOpacity = 0.85;
var defaultLineWidth = 0.05;
//var strokes = [];
var palette = [];

var strokeCounter = 0;
var isDrawing = false;
var isPlaying = true;
var debugPos = false;
var tempStroke;
var tempStrokeGeometry;
var tempPoints = [];
var minDistance = 0.01;
var useMinDistance = true;
var roundValues = true;
var numPlaces = 7;
var altKeyBlock = false;

var useAudioSync = false;

var c1b0_blocking = false;
var c1b1_blocking = false;
var c1b2_blocking = false;
var c1b3_blocking = false;
var c2b0_blocking = false;
var c2b1_blocking = false;
var c2b2_blocking = false;
var c2b3_blocking = false;

function animate(timestamp) {
    if (viveMode) updateControllers();

    if (armFrameForward) {
        armFrameForward = false;
        isPlaying = false;
        frameForward();
        if (latkDebug) console.log("ff: " + counter);
    }
    if (armFrameBack) {
        armFrameBack = false;
        isPlaying = false;
        frameBack();
        if (latkDebug) console.log("rew: " + counter);
    }
    if (armTogglePause) {
        isPlaying = !isPlaying;
        if (latkDebug) console.log("playing: " + isPlaying);
        armTogglePause = false;
    }

    if (isPlaying) {
        if (!useAudioSync && !hidden) {
            pTime = time;
            time = new Date().getTime() / 1000;
            frameDelta += time - pTime;
        } else if (useAudioSync && !hidden) {
            /*
            if (subtitleText) {
                subtitleText.lookAt(camera);
                subtitleText.rotation.set(0, -45, 0);
            }
            */
        }

        if (frameDelta >= frameInterval) {
            frameDelta = 0;

            frameMain();
        }

        if (isDrawing) {
            var last = layers.length - 1;
            var drawTrailLength = 4;

            if (drawWhilePlaying && layers[last].frames.length > 1 && layers[last].frames[layers[last].previousFrame].length > 0) {
                var lastStroke = layers[last].frames[layers[last].previousFrame][layers[last].frames[layers[last].previousFrame].length - 1];
                var points = getPoints(lastStroke);

                for (var pts = parseInt(points.length / drawTrailLength) + 1; pts < points.length - 1; pts++) {
                    createTempStroke(points[pts].x, points[pts].y, points[pts].z);
                }
                layers[last].frames[layers[last].counter].push(tempStroke);
                //~
                endStroke();

                beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
            }
        }

        /*
        if (isDrawing) {
            var last = layers.length - 1;
            var drawTrailLength = 4;

            if (drawWhilePlaying && layers[last].frames.length > 1 && layers[last].frames[layers[last].previousFrame].length > 0) {
                var lastStroke = layers[last].frames[layers[last].previousFrame][layers[last].frames[layers[last].previousFrame].length - 1];
                var points = getPoints(lastStroke);
                console.log(points);
                
                for (var pts = parseInt(points.length / drawTrailLength); pts < points.length - 1; pts++) {
                    //layerList[currentLayer].frameList[layerList[currentLayer].currentFrame].brushStrokeList[layerList[currentLayer].frameList[layerList[currentLayer].currentFrame].brushStrokeList.Count - 1].points.Add(lastStroke.points[pts]);
                    updateStroke(points[pts].x, points[pts].y, points[pts].z);
                }
                    endStroke();
                    beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
            }
        }
        */

        /*
        if (clicked && !isDrawing) {
            beginStroke();
            if (drawWhilePlaying && isPlaying && layerList[currentLayer].frameList.Count > 1 && layerList[currentLayer].frameList[layerList[currentLayer].previousFrame].brushStrokeList.Count > 0) {
                BrushStroke lastStroke = layerList[currentLayer].frameList[layerList[currentLayer].previousFrame].brushStrokeList[layerList[currentLayer].frameList[layerList[currentLayer].previousFrame].brushStrokeList.Count - 1];
                for (int pts = lastStroke.points.Count / drawTrailLength; pts < lastStroke.points.Count - 1; pts++) {
                    layerList[currentLayer].frameList[layerList[currentLayer].currentFrame].brushStrokeList[layerList[currentLayer].frameList[layerList[currentLayer].currentFrame].brushStrokeList.Count - 1].points.Add(lastStroke.points[pts]);
                }
            }
        }
        */
    }

    if (useAudioSync && !hidden) {
        if (subtitleText) {
            subtitleText.lookAt(camera);
            subtitleText.rotation.set(0, -45, 0);
        }
    }
        
    if (armSaveJson) {
        armSaveJson = false;
        isPlaying = false;
        writeJson();
    }   
    
    if (viveMode) {
        effect.requestAnimationFrame( animate );
        render();
    } else {
        render(timestamp);
        requestAnimationFrame(animate);         
    }
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

function createTextAlt(_text, x, y, z) {
    var loader = new THREE.FontLoader();

    loader.load("./fonts/helvetiker_bold.typeface.json", function (font) {
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
    });
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
    return ((layers[getLongestLayer()].loopCounter * (layers[getLongestLayer()].frames.length - 1)) + (_frame + subsFrameOffset)) * frameInterval;
}

function showReading() {
    readingText = createText("READING...", 0, 0, -2000);//1300, -1200, -2800);
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

function tempStrokeToJson() {
    try {
        var color = defaultColor;
        var sb = [];
        sb.push("{");
        sb.push("\"timestamp\": " + new Date().getTime() + ",");
        sb.push("\"index\": " + layers[layers.length-1].counter + ",");
        sb.push("\"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "],");
        sb.push("\"points\": [");
        for (var j=0; j<tempStroke.geometry.attributes.position.array.length; j += 6 ) { 
            var x = 0.0;
            var y = 0.0;
            var z = 0.0;
            var point = new THREE.Vector3(tempStroke.geometry.attributes.position.array[j], tempStroke.geometry.attributes.position.array[j+1], tempStroke.geometry.attributes.position.array[j+2]);

            x = point.x;
            y = point.y;
            z = point.z;

            if (x!=NaN && y!=NaN && z!=NaN) {
                sb.push("{\"co\": [" + x + ", " + y + ", " + z + "]");                  
                if (j >= tempStroke.geometry.attributes.position.array.length - 6) {
                    sb[sb.length-1] += "}";
                } else {
                    sb[sb.length-1] += "},";
                }
            }
        }
        sb.push("]");
        sb.push("}");

        return JSON.parse(sb.join(""));
    } catch (e) {
        console.log("Something went wrong sending a stroke.")
    }
}


// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

var dropZone;

// Show the copy icon when dragging over.  Seems to only work for chrome.
function onDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';    
}

function onDrop(e) {
    //showReading();

    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files; // Array of all files
    for (var i=0, file; file=files[i]; i++) {
        var reader = new FileReader();
        var droppedFileName = files[i].name;
                
        pauseAnimation = true;
        clearFrame();
        subsCounter = 0;
        layers = [];

        if (droppedFileName.split(".")[droppedFileName.split(".").length-1] === "json") {
            reader.onload = function(e2) {
                jsonToGp(JSON.parse(e2.target.result).grease_pencil[0]);
            }
        
            reader.readAsText(file, 'UTF-8');
        } else {            
            reader.onload = function(e2) {
                var zip = new JSZip();
                zip.loadAsync(e2.target.result).then(function() {
                    var fileNameOrig = droppedFileName.split('\\').pop().split('/').pop();
                    var fileName = fileNameOrig.split('.')[0] + ".json";
                    zip.file(fileName).async("string").then(function(response) {
                        jsonToGp(JSON.parse(response).grease_pencil[0]);
                    });
                });
            }

            reader.readAsBinaryString(file);
        }

        pauseAnimation = false; 
    }      
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

function createMtl(color, opacity, lineWidth) {
    var mtl = new THREE.MeshLineMaterial({
        useMap: 1,
        map: texture,
        transparent: true,
        color: new THREE.Color(color[0],color[1],color[2]),
        //sizeAttenuation: false,
        opacity: opacity, 
        lineWidth: lineWidth,
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
        if (compareColor(color, paletteColor, 5)) {
            mtlIndex = i;
            if (latkDebug) console.log("Found palette match at index " + i);
            break;
        }
    }
    if (mtlIndex === -1) {
        var mtl = createMtl(color, defaultOpacity, defaultLineWidth/1.5);
        palette.push(mtl);
        if (latkDebug) console.log("Creating new color, " + palette.length + " total colors");
        return palette[palette.length-1];
    } else {
        if (latkDebug) console.log("Reusing color " + mtlIndex + ", " + palette.length + " total colors");
        return palette[mtlIndex];
    }
}

function compareColor(c1, c2, numPlaces) {
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

function onMouseDown(event) {
    clicked = true;  
    updateMousePos(event);
    if (!altKeyBlock) beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
}

function onMouseUp(event) {
    clicked = false;
    endStroke();
}

function onMouseMove(event) {
    if (isDrawing) {
        updateMousePos(event);
        updateStroke(mouse3D.x, mouse3D.y, mouse3D.z);
    }
}

function updateMousePos(event) {
    mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
    mouse3D.unproject(camera);   
    if (latkDebug) console.log(mouse3D);
}

function onTouchStart(event) {
    clicked = true;  
    updateTouchPos(event);
    beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
}

function onTouchEnd(event) {
    clicked = false;
    endStroke();
}

function onTouchMove(event) {
    if (isDrawing) {
        updateTouchPos(event);
        updateStroke(mouse3D.x, mouse3D.y, mouse3D.z);
    }
}

function updateTouchPos(event) {
    if (event.targetTouches.length > 0) {
        var touch = event.targetTouches[0];
        mouse3D = new THREE.Vector3((touch.pageX / window.innerWidth) * 2 - 1, -(touch.pageY / window.innerHeight) * 2 + 1, 0.5);
        mouse3D.unproject(camera);   
        if (debug) console.log(mouse3D);    
    }
}

// ~ ~ ~ 
function beginStroke(x, y, z) {
    isDrawing = true;
    //isPlaying = false;
    tempPoints = [];
    //clearTempStroke();
    createTempStroke(x, y, z);
    if (latkDebug) console.log("Begin " + tempStroke.name + ".");
}

function updateStroke(x, y, z) {
    var p = new THREE.Vector3(x, y, z);

    if (p.distanceTo(tempPoints[tempPoints.length-1]) > minDistance) {
        clearTempStroke();
        createTempStroke(x, y, z);
        if (latkDebug) console.log("Update " + tempStroke.name + ": " + tempStrokeGeometry.vertices.length + " points."); 
    }
}

function endStroke() {  // TODO draw on new layer
    //if (isDrawing) {
	isDrawing = false;
    var last = layers.length-1;
    layers[last].frames[layers[last].counter].push(tempStroke);
    //~
    socket.emit("clientStrokeToServer", tempStrokeToJson());
    //~
    clearTempStroke();
    refreshFrameLast();
    if (latkDebug) console.log("End " + layers[last].frames[layers[last].counter][layers[last].frames[layers[last].counter].length-1].name + ".");
    strokeCounter++;
	//}
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
    tempStroke = new THREE.Mesh(line.geometry, createUniqueMtl(defaultColor));
    tempStroke.name = "stroke" + strokeCounter;
    scene.add(tempStroke);
}

// ~ ~ ~ 

function refreshFrame(index) {
	if (layers[index].frames[layers[index].counter]) {
	    for (var i=0; i<layers[index].frames[layers[index].counter].length; i++) {
	        scene.add(layers[index].frames[layers[index].counter][i]);
	    }
	    socket.emit("clientRequestFrame", { num: layers[index].counter });
	}
}

function refreshFrameLast() {  // TODO draw on new layer
    var last = layers.length - 1;
    scene.add(layers[last].frames[layers[last].counter][layers[last].frames[layers[last].counter].length-1]);
}

function clearFrame() {
    for (var i=scene.children.length; i>=0; i--) {
        if (scene.children[i] !== camera && scene.children[i] !== subtitleText  && scene.children[i] !== room) {
            scene.remove(scene.children[i]);
        }
    }
}

function clearTempStroke() {
    try {
        scene.remove(tempStroke);
        if (latkDebug) console.log("Removed temp stroke.")
    } catch (e) { }       
}

function redrawFrame(index) {
    if (index === 0) clearFrame();
    refreshFrame(index);
}

function frameMain() {
    for (var h=0; h<layers.length; h++) {
        redrawFrame(h);
        layers[h].previousFrame = layers[h].counter;
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

function getLongestLayer() {
    var returns = 0;
    for (var h=0; h<layers.length; h++) {
        if (layers[h].frames.length > returns) returns = h;
    }
    return returns;
}

function getPoints(stroke){
    var returns = [];
    try {
        for (var i=0; i<stroke.geometry.attributes.position.array.length; i += 6) { 
            var point = new THREE.Vector3(stroke.geometry.attributes.position.array[i], stroke.geometry.attributes.position.array[i+1], stroke.geometry.attributes.position.array[i+2]);
            returns.push(point);
        }
    } catch (e) {
        console.log(e.data);
    }
    return returns;
}

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

function latkStart() {
    player = new Tone.Player({
        "url": soundPath
    }).toMaster();

    // ~ ~ ~ ~ ~ ~ 
    document.addEventListener("visibilitychange", visibilityChanged);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);

    document.addEventListener("keydown", function(event) {
    	if (event.altKey && !altKeyBlock) {
    		altKeyBlock = true;
    		console.log(altKeyBlock);
    	}
    });
    document.addEventListener("keyup", function(event) {
    	if (altKeyBlock) {
    		altKeyBlock = false;
    		console.log(altKeyBlock);
    	}
    });

    dropZone = document.getElementsByTagName("body")[0];
    dropZone.addEventListener('dragover', onDragOver);
    dropZone.addEventListener('drop', onDrop);
    // ~ ~ ~ ~ ~ ~ 

    init();
    if (!viveMode) showReading();

    if (animationPath.split(".")[animationPath.split(".").length-1] === "json") {
        loadJSON(animationPath, function(response) {
            jsonToGp(JSON.parse(response).grease_pencil[0]);
        });
    } else {
        JSZipUtils.getBinaryContent(animationPath, function(err, data) {
            if (err) {
                throw err; // or handle err
            }

            var zip = new JSZip();
            zip.loadAsync(data).then(function () {
                var fileNameOrig = animationPath.split('\\').pop().split('/').pop();
                var fileName = fileNameOrig.split('.')[0] + ".json";
                zip.file(fileName).async("string").then(function(response) {
                    jsonToGp(JSON.parse(response).grease_pencil[0]);
                });
            });
        });
    }

}    

class Stroke {

    constructor(x, y, z) {
        this.points = [];
        this.smoothReps = 10;
        this.splitReps = 2;
        this.geometry;
        this.mesh;
   	    this.addPoints(x, y, z);
        this.createStroke();
    }

	rebuildGeometry() {
	    this.geometry = new THREE.Geometry();
	    this.geometry.dynamic = true;
	    for (var i=0; i<this.points.length; i++) {
	        this.geometry.vertices.push(this.points[i]);
	    }
	    this.geometry.verticesNeedUpdate = true;
	    this.geometry.__dirtyVertices = true; 
	}

	addPoints(x, y, z) {
	    this.points.push(new THREE.Vector3(x, y, z));
	    this.rebuildGeometry();
	}

	clearStroke() {
	    try {
	        scene.remove(this.mesh);
	    } catch (e) { }       
	}

	createStroke() {
	    var line = new THREE.MeshLine();
	    line.setGeometry(this.geometry);
	    this.mesh = new THREE.Mesh(line.geometry, createUniqueMtl([0.667, 0.667, 1]));
	    this.mesh.name = "stroke" + strokeCounter;
	    scene.add(this.mesh);
	}

	updateMesh(x, y, z) {
        this.clearStroke();
	    this.addPoints(x, y, z);
        this.createStroke();
	}

	refreshMesh() {
        this.clearStroke();
        this.rebuildGeometry();
        this.createStroke();   
	}

    smooth() {
        var weight = 18;
        var scale = 1.0 / (weight + 2);
        var nPointsMinusTwo = this.points.length - 2;
        var lower, upper, center;

        for (var i = 1; i < nPointsMinusTwo; i++) {
            lower = this.points[i-1];
            center = this.points[i];
            upper = this.points[i+1];

            center.x = (lower.x + weight * center.x + upper.x) * scale;
            center.y = (lower.y + weight * center.y + upper.y) * scale;
            center.z = (lower.z + weight * center.z + upper.z) * scale;
            this.points[i] = center;
        }
    }

    split() {
        for (var i = 1; i < this.points.length; i+=2) {
            var x = (this.points[i].x + this.points[i-1].x) / 2;
            var y = (this.points[i].y + this.points[i-1].y) / 2;
            var z = (this.points[i].z + this.points[i-1].z) / 2;
            var p = new THREE.Vector3(x, y, z);
            this.points.splice(i, 0, p);
        }
    }

    refine() {
        for (var i=0; i<this.splitReps; i++){
            this.split();   
            this.smooth();  
        }
        for (var i=0; i<this.smoothReps - this.splitReps; i++){
            this.smooth();      
        }
		this.refreshMesh();   
    }

}
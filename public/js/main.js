
"use strict";

const renderer = new THREE.WebGLRenderer({ antialiasing: false, alpha: false, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000);

const exposure = 1.2;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = Math.pow(exposure, 4.0);

renderer.autoClear = false;
document.body.appendChild(renderer.domElement);

const cameraFov = 60;
const cameraAspect = window.innerWidth / window.innerHeight;
const cameraNear = 1;
const cameraFar = 1000;

const camera = new THREE.PerspectiveCamera(cameraFov, cameraAspect, cameraNear, cameraFar);
resetCameraPosition();

const clock = new THREE.Clock();

const scene = new THREE.Scene();
const fogColor = 0x000000;
const fogDensity = 0.00375;
scene.fog = new THREE.FogExp2(fogColor, fogDensity);
scene.background = new THREE.Color("#000000");  

const room = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0x202020, wireframe: true })
);
room.position.y = 0;
scene.add(room);

let now = 0;

const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0; //0;
bloomPass.strength = 6; //1.5;
bloomPass.radius = 0.8; //0.8

const renderPass = new THREE.RenderPass(scene, camera);

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);

let boxWidth, params, manager, lastRender;

let armSaveJson = false;
let armFrameForward = false;
let armFrameBack = false;
let armTogglePause = false;

let hidden = false;
let drawWhilePlaying = true;
let lightningArtistData;
let clicked = false;

let laScale = 10;
let laOffset = new THREE.Vector3(0, 0, 0);//100, -20, 150);//95, -22, 50);//(100, -20, 150);
let laRot = new THREE.Vector3(0, 0, 0);//145, 10, 0);

let useScaleAndOffset = true;
let globalScale = new THREE.Vector3(0.1, 0.1, 0.1);
let globalOffset = new THREE.Vector3(0, 0, 0);

let subsCounter = 0;
let subsFrameOffset = 44;
let fps = 12.0;
let frameInterval = (1.0/fps);// * 1000;
let frameDelta = 0;
let time = 0;
let pTime = 0;
let pauseAnimation = false;
let mouse3D = new THREE.Vector3(0, 0, 0);

let line_mtl = new THREE.LineBasicMaterial();

let latkDebug = false;

let defaultColor = [0.667, 0.667, 1];
let serverColor = [1, 0.5, 0.25];
let defaultOpacity = 0.85;
let defaultLineWidth = 0.05;
//let strokes = [];
let palette = [];

let strokeCounter = 0;
let isDrawing = false;
let isPlaying = true;
let debugPos = false;
let tempStroke;
let tempStrokeGeometry;
let tempPoints = [];
let minDistance = 0.01;
let useMinDistance = true;
let roundValues = true;
let numPlaces = 7;
let altKeyBlock = false;

let useAudioSync = false;

let c1b0_blocking = false;
let c1b1_blocking = false;
let c1b2_blocking = false;
let c1b3_blocking = false;
let c2b0_blocking = false;
let c2b1_blocking = false;
let c2b2_blocking = false;
let c2b3_blocking = false;

let latk;

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

function setup() {
    latk = Latk.read("../animations/jellyfish.latk");

    /*
    if (Util.checkQueryInUrl("frame")) {
        console.log("Frame query detected.");

        latk = Latk.read("../animations/test.json");
        setTimeout(function() {
            Util.saveImage();
        }, 2000);
    }
    */

    setupPlayer();

    draw();
}    

function draw() {
	if (latk.ready) {        
        updatePlayer();
	
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
	        }

	        if (frameDelta >= frameInterval) {
	            frameDelta = 0;

	            frameMain();
	        }

	        if (isDrawing) {
	            let last = latk.layers.length - 1;
	            let drawTrailLength = 3;

	            if (drawWhilePlaying && frameDelta === 0 && latk.layers[last].frames.length > 1 && latk.layers[last].frames[latk.layers[last].previousFrame].length > 0) {
	                let lastStroke = latk.layers[last].frames[latk.layers[last].previousFrame][latk.layers[last].frames[latk.layers[last].previousFrame].length - 1];
	                let points = getPoints(lastStroke);
	                let startIdx = parseInt(points.length - drawTrailLength);
	                if (startIdx < 0) startIdx = 0;
	                for (let pts = startIdx; pts < points.length-1; pts++) {
	                    createTempStroke(points[pts].x, points[pts].y, points[pts].z);
	                }
	                latk.layers[last].frames[latk.layers[last].counter].push(tempStroke);
	                //~
	                endStroke();

	                beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
	            }
	        }
	    }
       
	    if (armSaveJson) {
	        armSaveJson = false;
	        isPlaying = false;s
	        writeJson();
	    }   
	}

    composer.render();
    requestAnimationFrame(draw);         
}

function rotateAroundObjectAxis(object, axis, radians) {
    let rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

function rotateAroundWorldAxis(object, axis, radians) {
    let rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

function getLoopFrame(_frame) {
    return ((latk.layers[getLongestLayer()].loopCounter * (latk.layers[getLongestLayer()].frames.length - 1)) + (_frame + subsFrameOffset)) * frameInterval;
}

function roundVal(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
} 

function tempStrokeToJson() {
    try {
        let color = defaultColor;
        let sb = [];
        sb.push("{");
        sb.push("\"timestamp\": " + new Date().getTime() + ",");
        sb.push("\"index\": " + latk.layers[latk.layers.length-1].counter + ",");
        sb.push("\"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "],");
        sb.push("\"points\": [");
        for (let j=0; j<tempStroke.geometry.attributes.position.array.length; j += 6 ) { 
            let x = tempStroke.geometry.attributes.position.array[j];
            let y = tempStroke.geometry.attributes.position.array[j+1];
            let z = tempStroke.geometry.attributes.position.array[j+2];

            let point = cleanPoint(x, y, z);

            sb.push("{\"co\": [" + point.x + ", " + point.y + ", " + point.z + "]");                  
            if (j >= tempStroke.geometry.attributes.position.array.length - 6) {
                sb[sb.length-1] += "}";
            } else {
                sb[sb.length-1] += "},";
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

function createMtl(color) {
    let mtl = new THREE.LineBasicMaterial({
        color: new THREE.Color(color[0],color[1],color[2]),
    });
    return mtl;
}

function createUniqueMtl(color) {
    let mtlIndex = -1;
    for (let i=0; i<palette.length; i++) {
        let paletteColor = [palette[i].uniforms.color.value.r, palette[i].uniforms.color.value.g, palette[i].uniforms.color.value.b];
        if (compareColor(color, paletteColor, 5)) {
            mtlIndex = i;
            if (latkDebug) console.log("Found palette match at index " + i);
            break;
        }
    }
    if (mtlIndex === -1) {
        let mtl = createMtl(color);//, defaultOpacity, defaultLineWidth/1.5);
        palette.push(mtl);
        if (latkDebug) console.log("Creating new color, " + palette.length + " total colors");
        return palette[palette.length-1];
    } else {
        if (latkDebug) console.log("Reusing color " + mtlIndex + ", " + palette.length + " total colors");
        return palette[mtlIndex];
    }
}

function compareColor(c1, c2, numPlaces) {
    let r1 = roundVal(c1[0], numPlaces);
    let r2 = roundVal(c2[0], numPlaces);
    let g1 = roundVal(c1[1], numPlaces);
    let g2 = roundVal(c2[1], numPlaces);
    let b1 = roundVal(c1[2], numPlaces);
    let b2 = roundVal(c2[2], numPlaces);
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
        let touch = event.targetTouches[0];
        mouse3D = new THREE.Vector3((touch.pageX / window.innerWidth) * 2 - 1, -(touch.pageY / window.innerHeight) * 2 + 1, 0.5);
        mouse3D.unproject(camera);   
        //if (debug) console.log(mouse3D);    
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
    let p = new THREE.Vector3(x, y, z);

    if (p.distanceTo(tempPoints[tempPoints.length-1]) > minDistance) {
        clearTempStroke();
        createTempStroke(x, y, z);
        if (latkDebug) console.log("Update " + tempStroke.name + ": " + tempStrokeGeometry.vertices.length + " points."); 
    }
}

function endStroke() {  // TODO draw on new layer
    //if (isDrawing) {
	isDrawing = false;
    let last = latk.layers.length-1;
    latk.layers[last].frames[latk.layers[last].counter].push(tempStroke);
    //~
    socket.emit("clientStrokeToServer", tempStrokeToJson());
    //~
    clearTempStroke();
    refreshFrameLast();
    if (latkDebug) console.log("End " + latk.layers[last].frames[latk.layers[last].counter][latk.layers[last].frames[latk.layers[last].counter].length-1].name + ".");
    strokeCounter++;
	//}
    getMagentaButton(tempPoints);
}

function addTempPoints(x, y, z) {
    tempPoints.push(new THREE.Vector3(x, y, z));
    tempStrokeGeometry = new THREE.BufferGeometry();
    tempStrokeGeometry.setFromPoints(tempPoints);
}

function createTempStroke(x, y , z) {
    addTempPoints(x, y, z);
    let tempStroke = new THREE.Line(tempStrokeGeometry, createMtl(defaultColor));        
    tempStroke.name = "stroke" + strokeCounter;
    scene.add(tempStroke);
}

// ~ ~ ~ 

function getMagentaButton(points) {
    try {
        let p1 = points[0];
        let p2 = points[points.length-1];
        let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        let button = parseInt(angle * (4.0/180.0) + 4);
        console.log("Trigger button " + button);
        buttonUp(button);
        buttonDown(button, false);
    } catch (e) { 
        console.log(e);
    }
}

function refreshFrame(index) {
	if (latk.layers[index].frames[latk.layers[index].counter]) {
	    for (let i=0; i<latk.layers[index].frames[latk.layers[index].counter].length; i++) {
	        scene.add(latk.layers[index].frames[latk.layers[index].counter][i]);
	    }
	    socket.emit("clientRequestFrame", { num: latk.layers[index].counter });
	}
}

function refreshFrameLast() {  // TODO draw on new layer
    let last = latk.layers.length - 1;
    scene.add(latk.layers[last].frames[latk.layers[last].counter][latk.layers[last].frames[latk.layers[last].counter].length-1]);
}

function clearFrame() {
    clearScene(scene);
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
    for (let h=0; h<latk.layers.length; h++) {
        redrawFrame(h);
        latk.layers[h].previousFrame = latk.layers[h].counter;
        latk.layers[h].counter++;
        if (latk.layers[h].counter >= latk.layers[h].frames.length - 1) {
            latk.layers[h].counter = 0;
            latk.layers[h].loopCounter++;
            
            if (h == getLongestLayer()) {
                subsCounter = 0;
                scheduleSubtitles();
            }
        }
    }
}

function frameForward() {
    for (let h=0; h<latk.layers.length; h++) {        
        latk.layers[h].counter++;
        if (latk.layers[h].counter >= latk.layers[h].frames.length - 1) latk.layers[h].counter = 0;
        redrawFrame(h);
    }
}

function frameBack() {
    for (let h=0; h<latk.layers.length; h++) {        
        latk.layers[h].counter--;
        if (latk.layers[h].counter <= 0) latk.layers[h].counter = latk.layers[h].frames.length - 1;
        redrawFrame(h);
    }
}

function getLongestLayer() {
    let returns = 0;
    for (let h=0; h<latk.layers.length; h++) {
        if (latk.layers[h].frames.length > returns) returns = h;
    }
    return returns;
}

function getPoints(stroke){
    let returns = [];
    try {
        for (let i=0; i<stroke.geometry.attributes.position.array.length; i += 6) { 
            let point = new THREE.Vector3(stroke.geometry.attributes.position.array[i], stroke.geometry.attributes.position.array[i+1], stroke.geometry.attributes.position.array[i+2]);
            returns.push(point);
        }
    } catch (e) {
        console.log(e.data);
    }
    return returns;
}

setup();

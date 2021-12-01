
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
const cameraNear = 0.1;
const cameraFar = 100;

const camera = new THREE.PerspectiveCamera(cameraFov, cameraAspect, cameraNear, cameraFar);
resetCameraPosition();

const clock = new THREE.Clock();

const scene = new THREE.Scene();
const fogColor = 0x000000;
const fogDensity = 0.00375;
scene.fog = new THREE.FogExp2(fogColor, fogDensity);
scene.background = new THREE.Color("#000000");  

const roomColor = [0.05, 0.93, 0.03];
const room = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(roomColor[0], roomColor[1], roomColor[2]), wireframe: true })
);
room.position.y = 0;
scene.add(room);

const globalScale = new THREE.Vector3(50, -50, 50);
const globalOffset = new THREE.Vector3(-20, 60, -350); 

let now = 0;

const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0; //0;
bloomPass.strength = 10; //1.5;
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

let drawWhilePlaying = true;
let clicked = false;

let fps = 12.0;
let frameInterval = (1.0/fps);// * 1000;
let frameDelta = 0;
let time = 0;
let pTime = 0;
let pauseAnimation = false;
let mouse3D = new THREE.Vector3(0, 0, 0);

let isDrawing = false;
let isPlaying = true;
let debugPos = false;

let minDistance = 0.01;
let useMinDistance = true;
let roundValues = true;
let numPlaces = 7;
let altKeyBlock = false;

let c1b0_blocking = false;
let c1b1_blocking = false;
let c1b2_blocking = false;
let c1b3_blocking = false;
let c2b0_blocking = false;
let c2b1_blocking = false;
let c2b2_blocking = false;
let c2b3_blocking = false;

let latk;

function createMtl(color) {
    let mtl = new THREE.LineBasicMaterial({
        color: new THREE.Color(color[0],color[1],color[2]),
    });
    return mtl;
}

const localColor = [0.2, 0.2, 1];
const localMtl = createMtl(localColor);
const remoteColor = [1, 0.25, 0.25];
const remoteMtl = createMtl(remoteColor);

let bigLocalGeoBuffer = new THREE.BufferGeometry();
let bigLocalPoints = [];
let bigLocalLine = new THREE.LineSegments(bigLocalGeoBuffer, localMtl);
bigLocalLine.frustumCulled = false;
scene.add(bigLocalLine);

let bigRemoteGeoBuffer = new THREE.BufferGeometry();
let bigRemotePoints = [];
let bigRemoteLine = new THREE.LineSegments(bigRemoteGeoBuffer, remoteMtl);
bigRemoteLine.frustumCulled = false;
scene.add(bigRemoteLine);

let localTempVec3Array = [];
let remoteTempVec3Array = [];

const strokeLife = 0.01;

function setup() {
    latk = new Latk();//Latk.read("../animations/jellyfish.latk");
    for (let h=0; h<2; h++) {
        latk.layers.push(new LatkLayer());
        for (let i=0; i<12; i++) {
            latk.layers[h].frames.push(new LatkFrame());
        }
    }

    setupWasd();
    setupMouse();

    draw();
}    

function draw() {
    bigLocalPoints = [];
    bigRemotePoints = [];
    if (!isDrawing) localTempVec3Array = [];

    updateWasd();

    if (armFrameForward) {
        armFrameForward = false;
        isPlaying = false;
        frameForward();
        console.log("ff");
    }
    if (armFrameBack) {
        armFrameBack = false;
        isPlaying = false;
        frameBack();
        console.log("rew");
    }
    if (armTogglePause) {
        isPlaying = !isPlaying;
        console.log("playing: " + isPlaying);
        armTogglePause = false;
    }

    if (isPlaying) {
        pTime = time;
        time = new Date().getTime() / 1000;
        frameDelta += time - pTime;

        if (frameDelta >= frameInterval) {
            frameDelta = 0;

            frameMotor();
        }
        
        refreshRemoteFrame();
    }

    if (Math.random() < strokeLife) {
        for (let i=0; i<latk.layers.length; i++) {
            for (let j=0; j<latk.layers[i].frames.length; j++) {
                latk.layers[i].frames[j].strokes.shift();
            }
        }
    }

    refreshLocalFrame();

    if (armSaveJson) {
        armSaveJson = false;
        isPlaying = false;
        writeJson();
    }  

    composer.render();
    requestAnimationFrame(draw);     
}

function latkPointToVec3(latkPoint) {
    return new THREE.Vector3(latkPoint.co[0], latkPoint.co[1], latkPoint.co[2]);
}

function vec3ToLatkPoint(vec3) {
    return new LatkPoint([vec3.x, vec3.y, vec3.z]);
}

function convertLatkPointToLineSegments(latkPointArray) {
    let returns = [];
    for (let i=1; i<latkPointArray.length; i++) {
        returns.push(latkPointToVec3(latkPointArray[i-1]));
        returns.push(latkPointToVec3(latkPointArray[i]));
    }
    return returns;
}

function convertVec3ToLineSegments(vec3Array) {
    let returns = [];
    for (let i=1; i<vec3Array.length; i++) {
        returns.push(vec3Array[i-1]);
        returns.push(vec3Array[i]);
    }
    return returns; 
}

function convertVec3ToLatkArray(vec3Array) {
    let returns = [];
    for (let vec3 of vec3Array) {
        returns.push(vec3ToLatkPoint(vec3));
    }
    return returns;
}

function roundVal(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
} 

function tempStrokeToJson() {
    //try {
    let layer = latk.getLastLayer();

    let sb = [];
    sb.push("{");
    sb.push("\"timestamp\": " + new Date().getTime() + ",");
    sb.push("\"index\": " + layer.counter + ",");
    sb.push("\"color\": [" + localColor[0] + ", " + localColor[1] + ", " + localColor[2]+ "],");
    sb.push("\"points\": [");
    for (let i=0; i<localTempVec3Array.length; i++) { 
        let x = localTempVec3Array[i].x;
        let y = localTempVec3Array[i].y;
        let z = localTempVec3Array[i].z;

        sb.push("{\"co\": [" + x + ", " + y + ", " + z + "]");                  
        if (i >= localTempVec3Array.length - 1) {
            sb[sb.length-1] += "}";
        } else {
            sb[sb.length-1] += "},";
        }
    }
    sb.push("]");
    sb.push("}");

    return JSON.parse(sb.join(""));
    //} catch (e) {
        //console.log("Something went wrong sending a stroke.")
    //}
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

function beginStroke(x, y, z) {
    isDrawing = true;
    //isPlaying = false;
    localTempVec3Array = [];
    localTempVec3Array.push(new THREE.Vector3(x, y, z));
    console.log("Begin new stroke.");
}

function updateStroke(x, y, z) {
    //let p = new THREE.Vector3(x, y, z);

    //if (p.distanceTo(localTempVec3Array[localTempVec3Array.length-1]) > minDistance) {
        localTempVec3Array.push(new THREE.Vector3(x, y, z));
        console.log("Update " + localTempVec3Array.length + " points."); 
    //}
}

function endStroke() {  // TODO draw on new layer
    //if (isDrawing) {
	isDrawing = false;
    createStroke(localTempVec3Array, 0);
    //~
    socket.emit("clientStrokeToServer", tempStrokeToJson());
    //~
    console.log("End stroke.");
	//}
    getMagentaButton(localTempVec3Array);
}

function createStroke(vec3Array, index) {
    if (index == 0) {
        latk.layers[index].getCurrentFrame().strokes.push(new LatkStroke(convertVec3ToLatkArray(vec3Array)));
    } else {
        if (Math.random() < vec3Array.length/500.0) {
            let stroke = new LatkStrokeMorph(convertVec3ToLatkArray(vec3Array));
            stroke.doTurtle();
            latk.layers[index].getCurrentFrame().strokes.push(stroke);     
        } else {
            latk.layers[index].getCurrentFrame().strokes.push(new LatkStroke(convertVec3ToLatkArray(vec3Array)));            
        }   
    }
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

function refreshRemoteFrame() {
	socket.emit("clientRequestFrame", { num: latk.layers[1].counter });

    for (let stroke of latk.layers[1].getCurrentFrame().strokes) {
        bigRemotePoints = bigRemotePoints.concat(convertLatkPointToLineSegments(stroke.points));
    }

    bigRemoteGeoBuffer.setFromPoints(bigRemotePoints); 
}

function refreshLocalFrame() {
    bigLocalPoints = convertVec3ToLineSegments(localTempVec3Array);
    
    for (let stroke of latk.layers[0].getCurrentFrame().strokes) {
        bigLocalPoints = bigLocalPoints.concat(convertLatkPointToLineSegments(stroke.points));
    }

    bigLocalGeoBuffer.setFromPoints(bigLocalPoints);
}

function frameMotor() {
    for (let h=0; h<latk.layers.length; h++) {
        //redrawFrame(h);
        latk.layers[h].previousFrame = latk.layers[h].counter;
        latk.layers[h].counter++;
        if (latk.layers[h].counter >= latk.layers[h].frames.length - 1) {
            latk.layers[h].counter = 0;
            latk.layers[h].loopCounter++;
        }
    }
}

function frameForward() {
    for (let h=0; h<latk.layers.length; h++) {        
        latk.layers[h].counter++;
        if (latk.layers[h].counter >= latk.layers[h].frames.length - 1) latk.layers[h].counter = 0;
    }
    refreshRemoteFrame();
}

function frameBack() {
    for (let h=0; h<latk.layers.length; h++) {        
        latk.layers[h].counter--;
        if (latk.layers[h].counter <= 0) latk.layers[h].counter = latk.layers[h].frames.length - 1;
    }
    refreshRemoteFrame();
}

setup();

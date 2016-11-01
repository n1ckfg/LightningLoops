"use strict";

var container;
var renderer, scene, camera, controls, effect, clock, light;
var composer, renderPass, bloomPass, copyPass;
var boxWidth, params, manager, lastRender;
var controller1, controller2;
var gamepad1, gamepad2;

var room;

var sprites = [];
var colliders = [];

var isWalking = false;
var isFlying = false;
var flyingThreshold = 0.15;
var movingSpeed = 0;
var movingSpeedMax = 0.25;
var movingDelta = 0.02;
var floor = 0;
var gravity = 0.01;
var cameraGaze;

var armSaveJson = false;
var armFrameForward = false;
var armFrameBack = false;
var armTogglePause = false;

function init() {
    if (WEBVR.isLatestAvailable() === false) {
        document.body.appendChild(WEBVR.getMessage());
    }

    container = document.createElement("div");
    document.body.appendChild(container);

    /*
    var info = document.createElement("div");
    info.style.position = "absolute";
    info.style.top = "10px";
    info.style.width = "100%";
    info.style.textAlign = "center";
    info.innerHTML = "<a href=\"http://threejs.org\" target=\"_blank\">three.js</a> webgl - htc vive";
    container.appendChild(info);
    */

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x101010);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);
    //document.body.appendChild(renderer.domElement);
    
    clock = new THREE.Clock;

    scene = new THREE.Scene();

    // fov, aspect, near, far
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);//10);
    scene.add(camera);

    room = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x202020, wireframe: true })
    );
    room.position.y = 3;
    scene.add(room);

    scene.add(new THREE.HemisphereLight(0x404020, 0x202040, 0.5));

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    controls = new THREE.VRControls(camera);
    controls.standing = true;
    
    // controllers
    controller1 = new THREE.ViveController(0);
    controller1.standingMatrix = controls.getStandingMatrix();
    scene.add(controller1);
    gamepad1 = navigator.getGamepads()[0];

    controller2 = new THREE.ViveController(1);
    controller2.standingMatrix = controls.getStandingMatrix();
    scene.add(controller2);
    gamepad2 = navigator.getGamepads()[1];

    var vivePath = "./models/vive-controller/";
    var loader = new THREE.OBJLoader();
    loader.load(vivePath + "vr_controller_vive_1_5.obj", function(object) {
        var loader = new THREE.TextureLoader();

        var controller = object.children[0];
        controller.material.map = loader.load(vivePath + "onepointfive_texture.png");
        controller.material.specularMap = loader.load(vivePath + "onepointfive_spec.png");

        controller1.add(object.clone());
        controller2.add(object.clone());
    });

    effect = new THREE.VREffect(renderer);

    if (WEBVR.isAvailable() === true) {
        document.body.appendChild(WEBVR.getButton(effect));
    }

    //

    window.addEventListener("resize", onWindowResize, false);

    //setupComposer();

    setupPlayer();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize(window.innerWidth, window.innerHeight);
}

/*
function animate() {
    requestAnimationFrame(animate);
    updateControllers();
    render();
}
*/

/*
function updateControllers() {
    if (gamepad1 !== undefined) {
        var pos = controller1.position.applyMatrix4(controller1.standingMatrix);
        console.log(
        "ctl1 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
        "ctl1 pad: "  + gamepad1.buttons[0].pressed + "\n" +
        "ctl1 trigger: "  + gamepad1.buttons[1].pressed + "\n" +
        "ctl1 grip: "  + gamepad1.buttons[2].pressed + "\n" +
        "ctl1 menu: "  + gamepad1.buttons[3].pressed
        );
        // ~ ~ ~
    }
    if (gamepad2 !== undefined) {
        var pos = controller2.position.applyMatrix4(controller2.standingMatrix);
        console.log(
        "ctl2 pos: " + pos.x + ", " + pos.y + ", " + pos.z + "\n" +
        "ctl2 pad: "  + gamepad2.buttons[0].pressed + "\n" +
        "ctl2 trigger: "  + gamepad2.buttons[1].pressed + "\n" +
        "ctl2 grip: "  + gamepad2.buttons[2].pressed + "\n" +
        "ctl2 menu: "  + gamepad2.buttons[3].pressed
        );
        // ~ ~ ~
    }       
}
*/

function render() {
    //updatePlayer();

    controls.update();
    effect.render(scene, camera);

    //updateComposer();
}

/*

function setupComposer() {
    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    bloomPass = new THREE.BloomPass(3, 25, 1, 512);
    composer.addPass(bloomPass);
    copyPass = new THREE.ShaderPass(THREE.CopyShader);
    copyPass.renderToScreen = true;
    composer.addPass(copyPass);  
}

function updateComposer() {
    //if (!effect.vrHMD) {
        composer.render();
    //}
}
*/
function setupControls() {
    /*
    window.addEventListener("touchstart", function(event) {
        isWalking = true;
    });

    window.addEventListener("touchend", function(event) {
        isWalking = false;
    })
    */

    window.addEventListener("keydown", function(event) {
        //if (getKeyCode() == 'w') isWalking = true;
        if (getKeyCode() == 's') armSaveJson = true;
        if (getKeyCode() == 'j') armFrameBack = true;
        if (getKeyCode() == 'k') armTogglePause = true;
        if (getKeyCode() == 'l') armFrameForward = true;        
    });

    window.addEventListener("keyup", function(event) {
        //if (getKeyCode() == 'w') isWalking = false;
    });
}

function getKeyCode() {
    var k = event.charCode || event.keyCode;
    var c = String.fromCharCode(k).toLowerCase();
    return c;
}

function setupPlayer() {
    //cameraGaze = new THREE.Object3D();
    //cameraGaze.position.set(0, 0.1, -60);
    //camera.add(cameraGaze);

    setupControls();
}

/*
function updatePlayer() {
    if (camera.rotation.x > flyingThreshold) {
        isFlying = true;
    } else {
        isFlying = false;
    }

    var cameraPos = camera.position.clone();
    var targetPos = cameraPos.clone();
    var aimPos = cameraGaze.getWorldPosition();

    if (isWalking) {
        if (movingSpeed < movingSpeedMax) {
            movingSpeed += movingDelta;
        } else if (movingSpeed > movingSpeedMax) {
            movingSpeed = movingSpeedMax;
        }
    } else {
        if (movingSpeed > 0) {
            movingSpeed -= movingDelta;
        } else if (movingSpeed < 0) {
            movingSpeed = 0;
        }
    }

    if (movingSpeed > 0) {
        targetPos.x += ( aimPos.x - cameraPos.x ) * (movingSpeed / 1000);
        if (isFlying) targetPos.y += ( aimPos.y - cameraPos.y ) * (movingSpeed / 1000);
        targetPos.z += ( aimPos.z - cameraPos.z ) * (movingSpeed / 1000);

        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        camera.updateMatrixWorld();
        camera.lookAt(aimPos);
    }

    if (!isWalking && camera.position.y > floor) {
        camera.position.y -= gravity;
        if (camera.position.y < floor) camera.position.y = floor;
    }
}

function spriteAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {          
    this.tilesHorizontal = tilesHoriz;
    this.tilesVertical = tilesVert;

    this.numberOfTiles = numTiles;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
    texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

    this.tileDisplayDuration = tileDispDuration;

    this.currentDisplayTime = 0;

    this.currentTile = 0;
        
    this.update = function( milliSec ) {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration) {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0;
            var currentColumn = this.currentTile % this.tilesHorizontal;
            texture.offset.x = currentColumn / this.tilesHorizontal;
            var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
            texture.offset.y = currentRow / this.tilesVertical;
        }
    };
}

function updateSprites() {
    var delta = clock.getDelta(); 
    for (var i=0; i<sprites.length; i++){
        sprites[i].update(1000 * delta);
    }
}

*/
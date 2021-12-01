"use strict";

let isWalkingForward = false;
let isWalkingBackward = false;
let isWalkingLeft = false;
let isWalkingRight = false;
let isFlyingUp = false;
let isFlyingDown = false;

let movingSpeed = 0;
let movingSpeedMax = 0.04;
let movingDelta = 0.002;

let keyIsPressed = false;

function setupWasd() {
    window.addEventListener("keydown", function(event) {
        keyIsPressed = true;
        if (Util.getKeyCode(event) === 'w') isWalkingForward = true;
        if (Util.getKeyCode(event) === 'a') isWalkingLeft = true;
        if (Util.getKeyCode(event) === 's') isWalkingBackward = true;
        if (Util.getKeyCode(event) === 'd') isWalkingRight = true;
        if (Util.getKeyCode(event) === 'q') isFlyingDown = true;
        if (Util.getKeyCode(event) === 'e') isFlyingUp = true;
    });

    window.addEventListener("keyup", function(event) {
        keyIsPressed = false;
        if (Util.getKeyCode(event) === 'w') isWalkingForward = false;
        if (Util.getKeyCode(event) === 'a') isWalkingLeft = false;
        if (Util.getKeyCode(event) === 's') isWalkingBackward = false;
        if (Util.getKeyCode(event) === 'd') isWalkingRight = false;
        if (Util.getKeyCode(event) === 'q') isFlyingDown = false;
        if (Util.getKeyCode(event) === 'e') isFlyingUp = false;
    });
}

function updateWasd() {
    if ((isWalkingForward || isWalkingBackward || isWalkingLeft || isWalkingRight || isFlyingUp || isFlyingDown) && movingSpeed < movingSpeedMax) {
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
    	if (isWalkingForward) {
            camera.translateZ(-movingSpeed);
    	}

    	if (isWalkingBackward) {
            camera.translateZ(movingSpeed);		
    	} 

    	if (isWalkingLeft) {
    		camera.translateX(-movingSpeed);
    	}

    	if (isWalkingRight) {
            camera.translateX(movingSpeed);
    	}

    	if (isFlyingUp) {
            camera.translateY(movingSpeed);
    	}

    	if (isFlyingDown) {
            camera.translateY(-movingSpeed);
    	}
    }
}


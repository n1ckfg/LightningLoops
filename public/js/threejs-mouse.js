"use strict";

let rotateStart = new THREE.Vector2(window.innerWidth/2, window.innerHeight/2);
let rotateEnd = new THREE.Vector2(0,0);
let rotateDelta = new THREE.Vector2(0,0);
let isDragging = false;

let MOUSE_SPEED_X = 0.5;
let MOUSE_SPEED_Y = 0.3;
let phi = 0;
let theta = 0;
let checkFocus = false;
let useTouch = true;

function setupMouse() {
    window.addEventListener("mousedown", function(event) {
        rotateStart.set(event.clientX, event.clientY);
        isDragging = true;
        clicked = true;  
        updateMousePos(event);
        if (!altKeyBlock) beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
    });

    // Very similar to https://gist.github.com/mrflix/8351020
    window.addEventListener("mousemove", function(event) {
        if (altKeyBlock) {
            if (!isDragging && !isPointerLocked()) {
                return;
            }

            // Support pointer lock API.
            if (isPointerLocked()) {
                let movementX = event.movementX || event.mozMovementX || 0;
                let movementY = event.movementY || event.mozMovementY || 0;
                rotateEnd.set(rotateStart.x - movementX, rotateStart.y - movementY);
            } else {
                rotateEnd.set(event.clientX, event.clientY);
            }

            // Calculate how much we moved in mouse space.
            rotateDelta.subVectors(rotateEnd, rotateStart);
            rotateStart.copy(rotateEnd);

            // Keep track of the cumulative euler angles.
            let element = document.body;
            phi += 2 * Math.PI * rotateDelta.y / element.clientHeight * MOUSE_SPEED_Y;
            theta += 2 * Math.PI * rotateDelta.x / element.clientWidth * MOUSE_SPEED_X;

            // Prevent looking too far up or down.
            phi = Util.clamp(phi, -Math.PI/2, Math.PI/2);

            //let euler = new THREE.Euler(-phi, -theta, 0, 'YXZ');
            let euler = new THREE.Euler(phi, theta, 0, 'YXZ');
            camera.quaternion.setFromEuler(euler);
        }

        if (isDrawing) {
            updateMousePos(event);
            updateStroke(mouse3D.x, mouse3D.y, mouse3D.z);
        }
    });

    window.addEventListener("mouseup", function(event) {
        isDragging = false;
        clicked = false;
        endStroke();
    });

    if (checkFocus) {
        window.addEventListener("focus", function(event) {
            isDragging = true;
        });

        window.addEventListener("blur", function(event) {
            isDragging = false;
        });
    }

    if (useTouch) {
        window.addEventListener("touchstart", function(event) {
            clicked = true;  
            updateTouchPos(event);
            beginStroke(mouse3D.x, mouse3D.y, mouse3D.z);
        });

        window.addEventListener("touchmove", function(event) {
            if (isDrawing) {
                updateTouchPos(event);
                updateStroke(mouse3D.x, mouse3D.y, mouse3D.z);
            }
        });

        window.addEventListener("touchend", function(event) {
            clicked = false;
            endStroke();
        });       
    }
}

function updateMousePos(event) {
    mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
    mouse3D.unproject(camera);   
}

function updateTouchPos(event) {
    if (event.targetTouches.length > 0) {
        let touch = event.targetTouches[0];
        mouse3D = new THREE.Vector3((touch.pageX / window.innerWidth) * 2 - 1, -(touch.pageY / window.innerHeight) * 2 + 1, 0.5);
        mouse3D.unproject(camera);   
    }
}

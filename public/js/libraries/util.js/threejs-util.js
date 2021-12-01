"use strict";

function clearScene(preserveList) {
    for (let i=scene.children.length-1; i>=0; i--) {
        let doRemove = true;
        if (preserveList !== undefined) {
            for (let preserveObj of preserveList) {
                if (scene.children[i] === preserveObj) {
                    doRemove = false;
                    break;
                }
            }
        }
        if (doRemove) {
            clearObj(scene.children[i]);
            scene.children.splice(i, 1);
        }
    }
}

function clearObj(obj) {
    while (obj.children.length > 0) { 
        clearObj(obj.children[0]);
        obj.remove(obj.children[0]);
    }
    
    if (obj.geometry) obj.geometry.dispose();

    if (obj.material) { 
        // in case of map, bumpMap, normalMap, envMap ...
        Object.keys(obj.material).forEach(prop => {
            if (!obj.material[prop]) {
                return;         
            }
            if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function') {
                obj.material[prop].dispose();
            }                                                  
        });
        obj.material.dispose();
    }
} 

function isPointerLocked() {
    let el = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
    return el !== undefined;
}

function resetCameraPosition() {
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    phi = 0;
    theta = 0;
}

window.addEventListener("resize", function(event) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
    composer.setSize( width, height );
}, false);

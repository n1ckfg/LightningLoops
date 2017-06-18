
"use strict";

// https://github.com/mrdoob/three.js/wiki/Drawing-lines
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html

function main() {
    viveMode = false;
    
    soundPath = "../sounds/avlt.ogg";
    animationPath = "../animations/jellyfish.json";
    brushPath = "../images/brush_vive.png";

    player = new Tone.Player({
        "url": soundPath
    }).toMaster();

    // ~ ~ ~ ~ ~ ~ 
    document.addEventListener("visibilitychange", visibilityChanged);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    dropZone = document.getElementsByTagName("body")[0];
    dropZone.addEventListener('dragover', onDragOver);
    dropZone.addEventListener('drop', onDrop);
    // ~ ~ ~ ~ ~ ~ 

    init();
    showReading();

    loadJSON(animationPath, function(response) {
        jsonToGp(JSON.parse(response).grease_pencil[0]);
    });

}

window.onload = main;
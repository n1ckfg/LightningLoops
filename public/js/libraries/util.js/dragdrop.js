"use strict";

const dropZone = document.getElementsByTagName("body")[0];
dropZone.addEventListener('dragover', onDragOver);
dropZone.addEventListener('drop', onDrop);

let dropResult;
let armDropResult = false;

// Show the copy icon when dragging over.  Seems to only work for chrome.
function onDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';    
}

function onDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = e.dataTransfer.files; // Array of all files
    for (let i=0, file; file=files[i]; i++) {
        let reader = new FileReader();
        reader.onload = function(e2) {
            dropResult = e2.target.result;
            armDropResult = true;
        }
        //reader.readAsText(file, 'UTF-8');
        reader.readAsDataURL(file);
    }      
}

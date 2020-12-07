"use strict";

let socket = io();

socket.on("newFrameFromServer", function(data) {
	console.log("Receiving new frame " + data[0]["index"] + " with " + data.length + " strokes.");

    for (let i=0; i<data.length; i++) {
        let origVerts = [];

        for (let j=0; j<data[i]["points"].length; j++) {
        	let co = data[i]["points"][j]["co"];
            origVerts.push(new THREE.Vector3(co[0], co[1], co[2]));
        }
        
        createStroke(origVerts, 1);
        
        getMagentaButton(origVerts);
	}
});

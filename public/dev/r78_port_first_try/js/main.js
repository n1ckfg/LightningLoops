"use strict";

// https://github.com/mrdoob/three.js/wiki/Drawing-lines
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html

function main() {

    var lightningArtistData;
    var laScale = 10;
    var laOffset = new THREE.Vector3(0, 3, 0);//95, -22, 50);//(100, -20, 150);
    var counter = 0;
    var fps = 12;
    var frameInterval = (1/fps) * 1000;
    var frameDelta = 0;
    var time = 0;
    var pTime = 0;

    var material, geometry;
    var line = [];
    var strokeX = [];
    var strokeY = [];
    var strokeZ = [];
    var frameX = [];
    var frameY = [];
    var frameZ = [];

    init();

    loadJSON(function(response) {
        lightningArtistData = JSON.parse(response);

        // TODO: fix loading only first stroke
        for (var i=0; i<lightningArtistData.brushstrokes.length; i++) { // frame
            strokeX = [];
            strokeY = [];
            strokeZ = [];
            for (var j=0; j<lightningArtistData.brushstrokes[i].length; j++) { // stroke 
                var bufferX = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                var bufferY = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                var bufferZ = new ArrayBuffer(lightningArtistData.brushstrokes[i][j].length * 4);
                
                var bufferXf = new Float32Array(bufferX);
                var bufferYf = new Float32Array(bufferY);
                var bufferZf = new Float32Array(bufferZ);
                
                for (var l=0; l<lightningArtistData.brushstrokes[i][j].length; l++) { // point
                    bufferXf[l] = (lightningArtistData.brushstrokes[i][j][l].x * laScale) + laOffset.x;
                    bufferYf[l] = (lightningArtistData.brushstrokes[i][j][l].y * laScale) + laOffset.y;
                    bufferZf[l] = (lightningArtistData.brushstrokes[i][j][l].z * laScale) + laOffset.z;
                    //line.geometry.vertices.push(new THREE.Vector3(x, y, z));
                    console.log("x: " + bufferXf[l] + "   y: " + bufferYf[l] + "   z: " + bufferZf[l]);
                    //console.log(i + " " + j + " " + l);
                }

                strokeX.push(bufferXf);
                strokeY.push(bufferYf);
                strokeZ.push(bufferZf);
            }

            frameX.push(strokeX);
            frameY.push(strokeY);
            frameZ.push(strokeZ);
        }

        material = new THREE.LineBasicMaterial({
            color: 0x9999ff,
            linewidth: 10
        });

        animate();
    });

    function animate() {
    //function render() {
        var delta = clock.getDelta();

        pTime = time;
        time = new Date().getTime();
        frameDelta += time - pTime;

        if (frameDelta >= frameInterval) {
            frameDelta = 0;
            var geometry = new THREE.Geometry();
            var line = new THREE.Line(geometry, material);

            line.geometry.dynamic = true;
            
            for (var i=0; i<frameX[counter].length; i++) {
                for (var j=0; j<frameX[counter][i].length; j++) {
                    line.geometry.vertices.push(new THREE.Vector3(frameX[counter][i][j],frameY[counter][i][j], frameZ[counter][i][j]));
                } 
            }

            line.geometry.verticesNeedUpdate = true;
            scene.add(line);

            counter++;
            if (counter > lightningArtistData.brushstrokes.length - 1) counter = 0;
            //}

            // vertex changes happen to the original geometry...
            //geometry.vertices[0].x += delta;

            //if (geometry.vertices[0].x > 10 || geometry.vertices[0].x < -10) delta *= -1;

            // ...but you have to set the update flag for a specific object in your scene.
            //line.geometry.verticesNeedUpdate = true;
        }

        requestAnimationFrame(animate);
        render();
    }

    function loadJSON(callback) { 
        // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript  
        var filepath = "./js/brushstrokes-saved2.json";

        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', filepath, true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);  
    }

}

window.onload = main;
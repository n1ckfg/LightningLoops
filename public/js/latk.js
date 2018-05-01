"use strict";

class Latk {

    constructor(filepath) {
        this.filepath = filepath;
        this.data;
        this.layers = [];
        this.read(filepath);
    }

    read(filepath) {
        this.filepath = filepath;
        this.loadJSON(this.filepath, function(response) {
            this.data = JSON.parse(response).grease_pencil[0];
            console.log(this.data);
            this.parseJSON(this.data);
        });
    }

    parseJSON(data) {
        for (var h=0; h<data.layers.length; h++) {
            // ~ ~ ~
            var layer = new LatkLayer();

            if (data.layers[h].name != null) {
                layer.name = data.layers[h].name;
            } else {
                layer.name = "WebVR Layer " + (h+1);
            }
            
            if (latkDebug) {
            	var frameCount = data.layers[h].frames.length;
	            var strokeCount = 0;
	            var pointCount = 0;
	            for (var i=0; i<data.layers[h].frames.length; i++) {
	                strokeCount += data.layers[h].frames[i].strokes.length;
	                for (var j=0; j<data.layers[h].frames[i].strokes.length; j++) {
	                    pointCount += data.layers[h].frames[i].strokes[j].points.length;
	                }
	            }
	            var firstPoint = "*";
	            try {
	                firstPoint = data.layers[h].frames[0].strokes[0].points[0].co[0] * 100;
	            } catch (e) { }
	            
                console.log("***********************");
                console.log("~INPUT~")
                console.log("total frames: " + frameCount);
                console.log("total strokes: " + strokeCount);
                console.log("total points: " + pointCount);
                console.log("first point: " + firstPoint);
                console.log("***********************");
            }

            for (var i=0; i<data.layers[h].frames.length; i++) { // frame
            	var frame = new LatkFrame();

                for (var j=0; j<data.layers[h].frames[i].strokes.length; j++) { // stroke 
                	var stroke = new LatkStroke();

                    /*
                    var bufferX = new ArrayBuffer(data.layers[h].frames[i].strokes[j].points.length * 4);
                    var bufferY = new ArrayBuffer(data.layers[h].frames[i].strokes[j].points.length * 4);
                    var bufferZ = new ArrayBuffer(data.layers[h].frames[i].strokes[j].points.length * 4);
                    
                    var bufferXf = new Float32Array(bufferX);
                    var bufferYf = new Float32Array(bufferY);
                    var bufferZf = new Float32Array(bufferZ);
                    */

                    for (var l=0; l<data.layers[h].frames[i].strokes[j].points.length; l++) { // point
                        /*
                        bufferXf[l] = (data.layers[h].frames[i].strokes[j].points[l].co[0] * laScale) + laOffset.x;
                        bufferYf[l] = (data.layers[h].frames[i].strokes[j].points[l].co[1] * laScale) + laOffset.y;
                        bufferZf[l] = (data.layers[h].frames[i].strokes[j].points[l].co[2] * laScale) + laOffset.z;
                        */
                    	var buffer = new Float32Array(new ArrayBuffer[12]);
                    	buffer[0] = (data.layers[h].frames[i].strokes[j].points[l].co[0] * laScale) + laOffset.x;
                        buffer[1] = (data.layers[h].frames[i].strokes[j].points[l].co[1] * laScale) + laOffset.y;
                        buffer[2] = (data.layers[h].frames[i].strokes[j].points[l].co[2] * laScale) + laOffset.z;

                        stroke.points.push(buffer);
                    }

                    var newColor = defaultColor;
                    try {
                        newColor = data.layers[h].frames[i].strokes[j].color;
                    } catch (e) { }
                    stroke.color = newColor;
                	
                	frame.strokes(push(stroke));
                }

                layer.frames.push(frame);
            }

            if (latkDebug) console.log("* * * color check: " + layer.frameX.length + " " + layer.frameColors.length + " " + layer.frameX[0].length + " " + layer.frameColors[0].length);

            // ~ ~ ~
            this.layers.push(layer);
        }

    }

    write() {
    	/*
        var frameCount = this.layers[getLongestLayer()].frames.length;
        var strokeCount = 0;
        var pointCount = 0;
        // http://stackoverflow.com/questions/35370483/geometries-on-vertex-of-buffergeometry-in-three-js
        var firstPoint = this.layers[getLongestLayer()].frames[0][0].geometry.attributes.position.array[0];
        for (var h=0; h<this.layers.length; h++) {
            for (var i=0; i<this.layers[h].frames.length; i++) {
                strokeCount += this.layers[h].frames[i].length;
                for (var j=0; j<this.layers[h].frames[i].length; j++) {
                    for (var l=0; l<this.layers[h].frames[i][j].geometry.attributes.position.array.length; l += 6) {//l += 2) {
                        pointCount++;
                    }
                }
            }
        }

        if (latkDebug) {
            console.log("***********************");
            console.log("~OUTPUT~")
            console.log("total frames: " + frameCount);
            console.log("total strokes: " + strokeCount);
            console.log("total points: " + pointCount);
            console.log("first point: " + firstPoint);
            console.log("***********************");
        }

        var sg = [];
        sg.push("{");
        sg.push("\t\"creator\": \"webvr\",");
        sg.push("\t\"grease_pencil\": [");
        sg.push("\t\t{");
        sg.push("\t\t\t\"layers\": [");
        var sl = [];
        for (var f=0; f<this.layers.length; f++) {
            var sb = [];
            var layer = this.layers[f];
            for (var h=0; h<layer.frames.length; h++) { 
                var currentFrame = h;
                sb.push("\t\t\t\t\t\t{"); // one frame
                sb.push("\t\t\t\t\t\t\t\"strokes\": [");
                if (layer.frames[currentFrame].length > 0) {
                    sb.push("\t\t\t\t\t\t\t\t{"); // one stroke
                } else {
                    sb.push("\t\t\t\t\t\t\t]"); // no strokes
                }
                for (var i=0; i<layer.frames[currentFrame].length; i++) { 
                    var color = defaultColor;
                    try {
                       color = [layer.frameColors[currentFrame][i][0], layer.frameColors[currentFrame][i][1], layer.frameColors[currentFrame][i][2]];
                    } catch (e) { }
                    sb.push("\t\t\t\t\t\t\t\t\t\"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "],");
                    sb.push("\t\t\t\t\t\t\t\t\t\"points\": [");
                    for (var j=0; j<layer.frames[currentFrame][i].geometry.attributes.position.array.length; j += 6 ) { 
                        var x = 0.0;
                        var y = 0.0;
                        var z = 0.0;

                        var point = new THREE.Vector3(layer.frames[currentFrame][i].geometry.attributes.position.array[j], layer.frames[currentFrame][i].geometry.attributes.position.array[j+1], layer.frames[currentFrame][i].geometry.attributes.position.array[j+2]);

                        if (useScaleAndOffset) {
                            x = (point.x * globalScale.x) + globalOffset.x
                            y = (point.y * globalScale.y) + globalOffset.y
                            z = (point.z * globalScale.z) + globalOffset.z
                        } else {
                            x = point.x;
                            y = point.y;
                            z = point.z;
                        }

                        if (roundValues) {
                            sb.push("\t\t\t\t\t\t\t\t\t\t{\"co\": [" + roundVal(x, numPlaces) + ", " + roundVal(y, numPlaces) + ", " + roundVal(z, numPlaces) + "]");
                        } else {
                            sb.push("\t\t\t\t\t\t\t\t\t\t{\"co\": [" + x + ", " + z + ", " + y + "]");                  
                        }

                        if (j >= layer.frames[currentFrame][i].geometry.attributes.position.array.length - 6) { 
                            sb[sb.length-1] += "}";
                            sb.push("\t\t\t\t\t\t\t\t\t]");
                            if (i == layer.frames[currentFrame].length - 1) { 
                                sb.push("\t\t\t\t\t\t\t\t}"); // last stroke for this frame
                            } else {
                                sb.push("\t\t\t\t\t\t\t\t},"); // end stroke
                                sb.push("\t\t\t\t\t\t\t\t{"); // begin stroke
                            }
                        } else {
                            sb[sb.length-1] += "},";
                        }
                    }
                    if (i == layer.frames[currentFrame].length - 1) { 
                        sb.push("\t\t\t\t\t\t\t]");
                    }
                }
                if (h == layer.frames.length - 1) { 
                    sb.push("\t\t\t\t\t\t}");
                } else {
                    sb.push("\t\t\t\t\t\t},");
                }
            }
            //~
            var sf = [];
            sf.push("\t\t\t\t{");
            sf.push("\t\t\t\t\t\"name\": \"" + layer.name + "\","); 
            sf.push("\t\t\t\t\t\"frames\": [");
            sf.push(sb.join("\n"));
            sf.push("\t\t\t\t\t]");
            if (f == this.layers.length-1) { 
                sf.push("\t\t\t\t}");
            } else {
                sf.push("\t\t\t\t},");
            }
            sl.push(sf.join("\n"));
            //~
        }
        sg.push(sl.join("\n"));
        sg.push("\t\t\t]");
        sg.push("\t\t}");
        sg.push("\t]");
        sg.push("}");

        var uriContent = "data:text/plain;charset=utf-8," + encodeURIComponent(sg.join("\n"));
        window.open(uriContent);
        */
    }

    loadJSON() { 
        // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript  
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', this.filepath, true);
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                this.data = xobj.responseText;
            }
        };
        xobj.send(null);  
    }

}

/*
JSZipUtils.getBinaryContent(animationPath, function(err, data) {
    if (err) {
        throw err; // or handle err
    }

    var zip = new JSZip();
    zip.loadAsync(data).then(function () {
        var fileNameOrig = animationPath.split('\\').pop().split('/').pop();
        var fileName = fileNameOrig.split('.')[0] + ".json";
        zip.file(fileName).async("string").then(function(response) {
            jsonToGp(JSON.parse(response).grease_pencil[0]);
        });
    });
});
*/

class LatkLayer {

    constructor() {
        this.name = "";
        this.frames = [];
        this.counter = 0;
        this.loopCounter = 0;
        this.previousFrame = 0;
    }

}

class LatkFrame {

    constructor() {
        this.strokes = [];
       	this.strokeX = [];
    	this.strokeY = [];
    	this.strokeZ = [];
    	this.frameX = [];
    	this.frameY = [];
    	this.frameZ = [];
    	this.strokeColors = [];
    	this.frameColors = [];
    }

}

class LatkStroke {

    constructor() {
        this.points = [];
    }
    
}
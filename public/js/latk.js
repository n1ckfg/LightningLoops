"use strict";

class LatkThree {

    constructor(filepath) {
        this.latk = new Latk(filepath);
        
        this.latk.ready(function(data)) 
        console.log(this.latk.data);
        this.layers = [];
        this.palette = [];
        this.counter = 0;
        this.loopCounter = 0;
        this.previousFrame = 0;

        var oldStrokes = [];

        var texture = THREE.ImageUtils.loadTexture(brushPath);

        for (var h=0; h<this.latk.data.layers; h++) {
            for (var i=0; i<latk.data.layers[0].frames.length; i++) {
                var strokes = [];
                for (var j=0; j<latk.data.layers[0].frames[i].strokes.length; j++) {
                    var geometry = new THREE.Geometry();
                    geometry.dynamic = true;

                    var origVerts = [];

                    for (var l=0; l<layer.frameX[i][j].length; l++) {
                        origVerts.push(new THREE.Vector3(layer.frameX[i][j][l], layer.frameY[i][j][l], layer.frameZ[i][j][l]));

                        if (l === 0 || !useMinDistance || (useMinDistance && origVerts[l].distanceTo(origVerts[l-1]) > minDistance)) {
                            geometry.vertices.push(origVerts[l]);
                        }
                    }

                    geometry.verticesNeedUpdate = true;
                    
                    var line = new THREE.MeshLine();
                    line.setGeometry(geometry);
                    var meshLine = new THREE.Mesh(line.geometry, createUniqueMtl([layer.frameColors[i][j][0], layer.frameColors[i][j][1], layer.frameColors[i][j][2]]));
                    strokes.push(meshLine);
                }
                if (strokes.length !== 0) {
                    oldStrokes = strokes;
                    layer.frames.push(strokes);  
                } else if (strokes.length === 0 && oldStrokes) {
                    layer.frames.push(oldStrokes);
                }            
            }
        }
    }

    roundVal(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    } 

    tempStrokeToJson() {
        try {
            var color = defaultColor;
            var sb = [];
            sb.push("{");
            sb.push("\"timestamp\": " + new Date().getTime() + ",");
            sb.push("\"index\": " + layers[layers.length-1].counter + ",");
            sb.push("\"color\": [" + color[0] + ", " + color[1] + ", " + color[2]+ "],");
            sb.push("\"points\": [");
            for (var j=0; j<tempStroke.geometry.attributes.position.array.length; j += 6 ) { 
                var x = 0.0;
                var y = 0.0;
                var z = 0.0;
                var point = new THREE.Vector3(tempStroke.geometry.attributes.position.array[j], tempStroke.geometry.attributes.position.array[j+1], tempStroke.geometry.attributes.position.array[j+2]);

                x = point.x;
                y = point.y;
                z = point.z;

                if (x!=NaN && y!=NaN && z!=NaN) {
                    sb.push("{\"co\": [" + x + ", " + y + ", " + z + "]");                  
                    if (j >= tempStroke.geometry.attributes.position.array.length - 6) {
                        sb[sb.length-1] += "}";
                    } else {
                        sb[sb.length-1] += "},";
                    }
                }
            }
            sb.push("]");
            sb.push("}");

            return JSON.parse(sb.join(""));
        } catch (e) {
            console.log("Something went wrong sending a stroke.")
        }
    }

    write() {
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
    }

    createUniqueMtl(color) {
        var mtlIndex = -1;
        for (var i=0; i<this.palette.length; i++) {
            var paletteColor = [this.palette[i].uniforms.color.value.r, this.palette[i].uniforms.color.value.g, this.palette[i].uniforms.color.value.b];
            if (compareColor(color, paletteColor, 5)) {
                mtlIndex = i;
                if (latkDebug) console.log("Found palette match at index " + i);
                break;
            }
        }
        if (mtlIndex === -1) {
            var mtl = createMtl(color, defaultOpacity, defaultLineWidth/1.5);
            this.palette.push(mtl);
            if (latkDebug) console.log("Creating new color, " + this.palette.length + " total colors");
            return this.palette[this.palette.length-1];
        } else {
            if (latkDebug) console.log("Reusing color " + mtlIndex + ", " + this.palette.length + " total colors");
            return this.palette[mtlIndex];
        }
    }

    compareColor(c1, c2, numPlaces) {
        var r1 = roundVal(c1[0], numPlaces);
        var r2 = roundVal(c2[0], numPlaces);
        var g1 = roundVal(c1[1], numPlaces);
        var g2 = roundVal(c2[1], numPlaces);
        var b1 = roundVal(c1[2], numPlaces);
        var b2 = roundVal(c2[2], numPlaces);
        if (r1 === r2 && g1 === g2 && b1 === b2) {
            return true;
        } else {
            return false;
        }
    }

}

class LatkLayerThree {

    constructor() {
        this.name = "";
        this.frames = [];
    }

}

class LatkFrameThree {

    constructor() {
        this.strokes = [];
    }

}

class LatkStrokeThree {

    constructor(x, y, z) {
        this.points = [];
        this.smoothReps = 10;
        this.splitReps = 2;
        this.geometry;
        this.mesh;
        this.addPoints(x, y, z);
        this.createStroke();
    }

    rebuildGeometry() {
        this.geometry = new THREE.Geometry();
        this.geometry.dynamic = true;
        for (var i=0; i<this.points.length; i++) {
            this.geometry.vertices.push(this.points[i]);
        }
        this.geometry.verticesNeedUpdate = true;
        this.geometry.__dirtyVertices = true; 
    }

    addPoints(x, y, z) {
        this.points.push(new THREE.Vector3(x, y, z));
        this.rebuildGeometry();
    }

    clearStroke() {
        try {
            scene.remove(this.mesh);
        } catch (e) { }       
    }

    createStroke() {
        var line = new THREE.MeshLine();
        line.setGeometry(this.geometry);
        this.mesh = new THREE.Mesh(line.geometry, createUniqueMtl([0.667, 0.667, 1]));
        this.mesh.name = "stroke" + strokeCounter;
        scene.add(this.mesh);
    }

    updateMesh(x, y, z) {
        this.clearStroke();
        this.addPoints(x, y, z);
        this.createStroke();
    }

    refreshMesh() {
        this.clearStroke();
        this.rebuildGeometry();
        this.createStroke();   
    }

    smooth() {
        var weight = 18;
        var scale = 1.0 / (weight + 2);
        var nPointsMinusTwo = this.points.length - 2;
        var lower, upper, center;

        for (var i = 1; i < nPointsMinusTwo; i++) {
            lower = this.points[i-1];
            center = this.points[i];
            upper = this.points[i+1];

            center.x = (lower.x + weight * center.x + upper.x) * scale;
            center.y = (lower.y + weight * center.y + upper.y) * scale;
            center.z = (lower.z + weight * center.z + upper.z) * scale;
            this.points[i] = center;
        }
    }

    split() {
        for (var i = 1; i < this.points.length; i+=2) {
            var x = (this.points[i].x + this.points[i-1].x) / 2;
            var y = (this.points[i].y + this.points[i-1].y) / 2;
            var z = (this.points[i].z + this.points[i-1].z) / 2;
            var p = new THREE.Vector3(x, y, z);
            this.points.splice(i, 0, p);
        }
    }

    refine() {
        for (var i=0; i<this.splitReps; i++){
            this.split();   
            this.smooth();  
        }
        for (var i=0; i<this.smoothReps - this.splitReps; i++){
            this.smooth();      
        }
        this.refreshMesh();   
    }

}


class Latk {

    constructor(filepath) {
        this.filepath = filepath;
        this.data;
        this.read(filepath);
        this.ready = false;
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

    read(filepath) {
        this.filepath = filepath;
        /* TODO if extension is zip {
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
        } else { }
        */
        this.loadJSON(this.filepath, function(response) {
            this.data = JSON.parse(response).grease_pencil[0];
            console.log(this.data);
            this.ready = true;
        });
    }

}


"use strict";

var strokeLifetime = 10000;

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = 8080;
const server = app.listen(port)
const ejs = require('ejs');
const io = require('socket.io').listen(server);

app.set('views', __dirname + '/views');
app.engine('.html', ejs.__express);
app.set('view-engine', 'html');
app.use(express.static(__dirname + '/public'));

// ~ ~ ~ ~

class Frame {
	constructor() {
		this.strokes = [];
	}
}

class Layer {
    constructor() {
        this.frames = [];
    }

    getFrame(index) {
    	if (!this.frames[index]) {
    		//console.log("Client asked for frame " + index +", but it's missing.");
    		for (var i=0; i<index+1; i++) {
    			if (!this.frames[i]) {
    				var frame = new Frame();
    				this.frames.push(frame); 
    				//console.log("* Created frame " + i + ".");
    			}
    		}
    	}
        //console.log("Retrieving frame " + index + " of " + this.frames.length + ".");
        return this.frames[index];
    }

    addStroke(data) {
        try {
    	var index = data["index"];
    	if (!isNaN(index)) {
    		this.getFrame(index); 
    		this.frames[index].strokes.push(data); 
            console.log("<<< Received a stroke with color (" + data["color"] + ") and " + data["points"].length + " points.");
    	}
        } catch (e) {
            console.log(e.data);
        }
    }
}

var layer = new Layer();

setInterval(function() {
	var time = new Date().getTime();

	for (var i=0; i<layer.frames.length; i++) {
		for (var j=0; j<layer.frames[i].strokes.length; j++) {
			if (time > layer.frames[i].strokes[j]["timestamp"] + strokeLifetime) {
				layer.frames[i].strokes.splice(j, 1);
				console.log("X Removing frame " + i + ", stroke " + j + ".");
			}
		}
	}
}, strokeLifetime);

// ~ ~ ~ ~

// https://socket.io/get-started/chat/

io.on('connection', function(socket){
    console.log('A user connected.');
    //~
    socket.on('disconnect', function(){
        console.log('A user disconnected.');
    });
    //~
    socket.on("clientStrokeToServer", function(data) { 
    	//console.log(data);
    	layer.addStroke(data);
    });
    //~
    socket.on("clientRequestFrame", function(data) {
        //console.log(data["num"]);
        var index = data["num"];
        if (index != NaN) {
        	var frame = layer.getFrame(index);
        	if (frame && frame.strokes.length > 0) {
        		io.emit("newFrameFromServer", frame.strokes);
                console.log("> > > Sending a new frame " + frame.strokes[0]["index"] + " with " + frame.strokes.length + " strokes.");
        	}
    	}
    });
});

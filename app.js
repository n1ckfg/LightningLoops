'use strict';

var strokeLifetime = 10000;

const dotenv = require('dotenv').config();
const PORT = 8080;
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const server = app.listen(PORT);
const chalk = require('chalk');
const socket = require('socket.io').listen(server);
// socket.set('log level', 0);
const ejs = require('ejs');

console.log(chalk.underline.green('Server is running on port ' + PORT));

app.set('views', __dirname + '/views');
app.engine('.html', ejs.__express);
app.set('view-engine', 'html');
app.use(express.static(__dirname + '/public'));

let isConnected = false;
let isStreaming = false;
let currentTimeSinceStreamStarted = 0.0;
let currentFrameSinceStreamStarted = 0;
let userCounter = 0;

app.get('/', (req, res)=>{
    // res.render('debug.html');
});

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

socket.on('connection', function(client) {
    
    userCounter++;
    if (process.env.LOGGING_VERBOSE) {
        console.log(chalk.bold.white('A user connected, we currently have ' + userCounter + ' users connected'));
    }
    
    client.emit('variable-name', 'value here');
    
    client.on('disconnect', function() {
        if (process.env.LOGGING_VERBOSE) {
            console.log(chalk.bold.white('A user disconnected, we currently have ' + userCounter + ' users connected'))
        }
    });

    client.on('clientStrokeToServer', function(data) {
        layer.addStroke(data);
    });

    client.on('clientRequestFrame', function(data) {
        var index = data["num"];
        if (index != NaN) {
            var frame = layer.getFrame(index);
            if (frame && frame.strokes.length > 0) {
                socket.emit("newFrameFromServer", frame.strokes);
                if (process.env.LOGGING_VERBOSE) {
                    console.log(chalk.bold.red("> > > Sending a new frame " + frame.strokes[0]["index"] + " with " + frame.strokes.length + " strokes."));
                }
            }
        }
    });

});
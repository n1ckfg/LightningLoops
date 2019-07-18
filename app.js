"use strict";

var express = require("express");
var app = express();
var http = require("http").Server(app);

var fs = require("fs");
var dotenv = require('dotenv').config();
var options = {
    key: fs.readFileSync(process.env.KEY_PATH),
    cert: fs.readFileSync(process.env.CERT_PATH)
};
var https = require("https").createServer(options, app);

var debug = process.env.DEBUG === "true";

// default -- pingInterval: 1000 * 25, pingTimeout: 1000 * 60
// low latency -- pingInterval: 1000 * 5, pingTimeout: 1000 * 10
var io;
var ping_interval = 1000 * 5;
var ping_timeout = 1000 * 10;

if (!debug) {
    io = require("socket.io")(https, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
} else {
    io = require("socket.io")(http, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
}

// ~ ~ ~ ~
    
app.use(express.static("public")); 

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

if (!debug) {
    app.use(function(request, response) {
        if (!request.secure) {
            response.redirect("https://" + request.headers.host + request.url);
        }
    });
}

var port = process.env.PORT;
var port_s = process.env.PORT_S;

http.listen(port, function() {
    console.log("\nNode app listening on port " + port);
});

https.listen(port_s, function() {
    console.log("\nNode app listening on https port " + port_s);
});

// ~ ~ ~ ~

var strokeLifetime = 10000;

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
        //try {
        var index = data["index"];
        if (!isNaN(index)) {
            this.getFrame(index); 

            this.frames[index].strokes.push(data); 
            console.log("<<< Received a stroke with color (" + data["color"] + ") and " + data["points"].length + " points.");
        }
        //} catch (e) {
            //console.log(e.data);
        //}
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
        try { // json coming from Unity needs to be parsed...
            var newData = JSON.parse(data);
            layer.addStroke(newData);
        } catch (e) { // ...but json coming from JS client does not need to be
            layer.addStroke(data);
        }
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

"use strict";

const express = require("express");
const app = express();

const cmd = require("node-cmd");
const crypto = require("crypto"); 
const bodyParser = require("body-parser");

const fs = require("fs");
const dotenv = require("dotenv").config();
const debug = process.env.DEBUG === "true";

let options;
if (!debug) {
    options = {
        key: fs.readFileSync(process.env.KEY_PATH),
        cert: fs.readFileSync(process.env.CERT_PATH)
    };
}

const https = require("https").createServer(options, app);

// default -- pingInterval: 1000 * 25, pingTimeout: 1000 * 60
// low latency -- pingInterval: 1000 * 5, pingTimeout: 1000 * 10
let io, http;
const ping_interval = 1000 * 5;
const ping_timeout = 1000 * 10;
const port_http = process.env.PORT_HTTP;
const port_https = process.env.PORT_HTTPS;
const port_ws = process.env.PORT_WS;

const WebSocket = require("ws");
const ws = new WebSocket.Server({ port: port_ws, pingInterval: ping_interval, pingTimeout: ping_timeout }, function() {
    console.log("\nNode.js listening on websocket port " + port_ws);
});

if (!debug) {
    http = require("http");

    http.createServer(function(req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(port_http);

    io = require("socket.io")(https, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
} else {
    http = require("http").Server(app);

    io = require("socket.io")(http, { 
        pingInterval: ping_interval,
        pingTimeout: ping_timeout
    });
}

// ~ ~ ~ ~
    
app.use(express.static("public")); 

// https://opensourcelibs.com/lib/glitchub
app.use(bodyParser.json());

const onWebhook = (req, res) => {
  let hmac = crypto.createHmac("sha1", process.env.SECRET);
  let sig  = `sha1=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;

  if (req.headers["x-github-event"] === "push" && sig === req.headers["x-hub-signature"]) {
    cmd.run("chmod +x ./redeploy.sh"); 
    cmd.run("./redeploy.sh");
    cmd.run("refresh");
  }

  return res.sendStatus(200);
}

app.post("/redeploy", onWebhook);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

// ~ ~ ~ ~

if (!debug) {
    https.listen(port_https, function() {
        console.log("\nNode.js listening on https port " + port_https);
    });
} else {
    http.listen(port_http, function() {
        console.log("\nNode.js listening on http port " + port_http);
    });
}

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

const strokeLifetime = 10000;

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
            for (let i=0; i<index+1; i++) {
                if (!this.frames[i]) {
                    let frame = new Frame();
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
            let index = data["index"];
            if (!isNaN(index)) {
                this.getFrame(index); 

                this.frames[index].strokes.push(data); 
                console.log("<<< Received a stroke with color (" + data["color"] + ") and " + data["points"].length + " points.");
            }
        } catch (e) {
            console.log("Error adding stroke" + e.data);
        }
    }
}

let layer = new Layer();

setInterval(function() {
    /*
    let time = new Date().getTime();

    for (let i=0; i<layer.frames.length; i++) {
        for (let j=0; j<layer.frames[i].strokes.length; j++) {
            if (time > layer.frames[i].strokes[j]["timestamp"] + strokeLifetime) {
                layer.frames[i].strokes.splice(j, 1);
                console.log("X Removing frame " + i + ", stroke " + j + ".");
            }
        }
    }
    */
    for (let i=0; i<layer.frames.length; i++) {
        layer.frames[i].strokes.shift();
        console.log("X Removing oldest stroke from frame " + i + ".");
    }
}, strokeLifetime);

// ~ ~ ~ ~

let lastIndex = 0;  // for ws

io.on("connection", function(socket) {
    console.log("A socket.io user connected.");
    //~
    socket.on("disconnect", function(event) {
        console.log("A socket.io user disconnected.");
    });
    //~
    socket.on("clientStrokeToServer", function(data) { 
        //console.log(data);
        try { // json coming from Unity needs to be parsed...
            let newData = JSON.parse(data);
            layer.addStroke(newData);
        } catch (e) { // ...but json coming from JS client does not need to be
            layer.addStroke(data);
        }
    });
    //~
    socket.on("clientRequestFrame", function(data) {
        //console.log(data["num"]);
        let index = data["num"];
        if (index != NaN) {
            lastIndex = index; // for ws
            let frame = layer.getFrame(index);
            if (frame && frame.strokes.length > 0) {
                io.emit("newFrameFromServer", frame.strokes);
                console.log("> > > Sending a new frame " + frame.strokes[0]["index"] + " with " + frame.strokes.length + " strokes.");
            }
        }
    });
});

ws.on("connection", function(socket) {
    console.log("A ws user connected.");
    //~
    socket.onclose = function(event) {
        console.log("A ws user disconnected.");
    };
    //~
    socket.onmessage = function(event) {
        //console.log(data["num"]);
        let index = lastIndex; //data["num"];
        if (index != NaN) {
            let frame = layer.getFrame(index);
            if (frame && frame.strokes.length > 0) {
                socket.send(JSON.stringify(frame.strokes));
                console.log("> WS > Sending a new frame " + frame.strokes[0]["index"] + " with " + frame.strokes.length + " strokes.");
            }
        }
    };
});

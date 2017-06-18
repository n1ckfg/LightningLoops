"use strict";

var express = require("express");
var app = express();
var http = require("http").Server(app);
var port = 8080;

var io = require("socket.io")(http, { 
	// default -- pingInterval: 1000 * 25, pingTimeout: 1000 * 60
	// low latency -- pingInterval: 1000 * 5, pingTimeout: 1000 * 10

	pingInterval: 1000 * 25,
	pingTimeout: 1000 * 60
});

// ~ ~ ~ ~
	
app.use(express.static("public")); 

app.get("/", function(req, res) {
	res.sendFile(__dirname + "/public/index.html");
});

http.listen(port, function() {
	console.log("\nNode app started. Listening on port " + port);
});

// ~ ~ ~ ~

// https://socket.io/get-started/chat/

io.on('connection', function(socket){
    console.log('a user connected');
    //~
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    //~
    socket.on("stroke", function(data) { 
    	//console.log(data);
    });
    //~
    socket.on("frame", function(data) {
        console.log(data);
        io.emit("frame", { my: "response" });
    });
});


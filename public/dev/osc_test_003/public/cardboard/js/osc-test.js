"use strict";
/*
var wsIp = "192.168.0.3";
var wsPort = 8080;

var rotX = 0;
var rotY = 0;
var rotZ = 0;
var scaleRot = 5;

var velX = 0;
var velY = 0;
var velZ = 0;
var minVel = 0.01;

var ease = 10;

var port = new osc.WebSocketPort({
    url: "ws://" + wsIp + ":" + wsPort
});

port.on("message", function (oscMessage) {
    var doPrint = false;

    if (oscMessage.address === "/wii/1/motion/angles") {
        rotX = rotScaler(oscMessage.args[0]);
        rotY = rotScaler(oscMessage.args[1]);
        rotZ = rotScaler(oscMessage.args[2]);
        //console.log(rotX);
    } else if (oscMessage.address === "/wii/1/motion/velo") {
        velX = oscMessage.args[0];
        velY = oscMessage.args[1];
        velZ = oscMessage.args[2];
        //doPrint = true;
    }

    if (doPrint) {
        $("#message").text(JSON.stringify(oscMessage, undefined, 2));
        console.log("message", oscMessage);
    }
});

port.open();

var sayHello = function () {
    port.send({
        address: "/hello",
        args: ["world"]
    });
};
*/

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ 
var boxPos;
var targetPos;

function setup() {
    createCanvas(640, 480, WEBGL);
    boxPos = createVector(width/10, height/10, 0);
    targetPos = createVector(width/10, height/10, 0);
}

function draw() {
    background(0);

	if (targetPos != null) {
	    if (checkVel(velX)) targetPos.y += -rotX;
	    if (checkVel(velY)) targetPos.x += rotY;
	    if (checkVel(velZ)) targetPos.z += rotZ;

	    boxPos = tween(boxPos, targetPos, ease);
	}

    translate(boxPos.x, boxPos.y, boxPos.z);
    box();
}

function rotScaler(rot) {
    return ((rot * 2) - 1) * scaleRot;
}

function checkVel(vel) {
    if (vel > minVel || vel < -minVel) {
        return true;
    } else {
        return false;
    }
}

function tween(v1, v2, e) {
    v1.x += (v2.x-v1.x)/e;
    v1.y += (v2.y-v1.y)/e;
    v1.z += (v2.z-v1.z)/e;
    return v1;
}
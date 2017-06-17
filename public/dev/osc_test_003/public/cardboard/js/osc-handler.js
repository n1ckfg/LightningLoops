"use strict";

var wsIp = "192.168.0.3";
var wsPort = 8080;

var rotX = 0;
var rotY = 0;
var rotZ = 0;
var scaleRot = 0.5;//5;

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
        rotX = oscMessage.args[0];
        rotY = oscMessage.args[1];
        rotZ = oscMessage.args[2];
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

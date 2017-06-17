var oscReceiveIp = "127.0.0.1";
var oscReceivePort = 7400;

var oscSendIp = "127.0.0.1";
var oscSendPort = 7400;

var wsPort = 8080;

var osc = require("osc");
var express = require("express");
var WebSocket = require("ws");

var getIPAddresses = function () {
    var os = require("os"),
        interfaces = os.networkInterfaces(),
        ipAddresses = [];

    for (var deviceName in interfaces) {
        var addresses = interfaces[deviceName];
        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];
            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};

var udp = new osc.UDPPort({
    localAddress: oscReceiveIp,
    localPort: oscReceivePort,
    remoteAddress: oscSendIp,
    remotePort: oscSendPort
});

udp.on("ready", function () {
    var ipAddresses = getIPAddresses();
    console.log("Listening for OSC over UDP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udp.options.localPort);
    });
    console.log("To start the demo, go to http://localhost:" + wsPort + " in your web browser.");
});

udp.open();

// Create an Express-based Web Socket server to which OSC messages will be relayed.
var app = express();
var server = app.listen(wsPort);
var wss = new WebSocket.Server({
        server: server
    });

app.use(express.static(__dirname + "/public"));

wss.on("connection", function (socket) {
    console.log("A Web Socket connection has been established!");
    var socketPort = new osc.WebSocketPort({
        socket: socket
    });

    var relay = new osc.Relay(udp, socketPort, {
        raw: true
    });
});

udp.on("message", function (oscMessage) {
    console.log(oscMessage);
});

/*
// Every second, send an OSC message
setInterval(function() {
    var msg = {
        address: "/hello/from/oscjs",
        args: [Math.random()]
    };

    console.log("Sending message", msg.address, msg.args, "to", udp.options.remoteAddress + ":" + udp.options.remotePort);
    udp.send(msg);
}, 1000);
*/

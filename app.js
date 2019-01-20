'use strict';

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

socket.on('connection', client => {
    
    userCounter++;
    if (process.env.LOGGING_VERBOSE) {
        console.log(chalk.bold.white('A user connected, we currently have ' + userCounter + ' users connected'));
    }
    
    client.emit('variable-name', 'value here');
    
    client.on('disconnect', ()=>{
        if (process.env.LOGGING_VERBOSE) {
            console.log(chalk.bold.white('A user disconnected, we currently have ' + userCounter + ' users connected'))
        }
    });

});
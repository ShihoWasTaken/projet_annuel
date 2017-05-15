#!/usr/bin/env node

var fs = require('fs'),
    net = require('net'),
    buffer = require('buffer'),
    stream = require('stream'),
    argv = require('yargs').argv,
    dgram = require('dgram'),
    http = require('http'),
    express = require('express'),
    app = express();
require('yargs')
  .usage('$0 [args]')
  .command('app.js [directory]')
  .help()
  .argv

var HOST = '0.0.0.0';
var PORT = 6969;
var PORT_CLIENT = 6968;
var FILEPATH = "/home/mathieu/Documents/"
var CLIENTS = [];

//Listen for broadcast
var PORTBT = 6024;
var client = dgram.createSocket('udp4');
client.on('listening', function () {
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
    client.setBroadcast(true);
});
client.on('message', function (message, rinfo) {
    console.log('Message from: ' + rinfo.address + ':' + rinfo.port +' - ' + message);
    if(message == 'discovery'){
      CLIENTS.push(rinfo.address);
      console.log(CLIENTS.length);
      for(var i=0; i<CLIENTS.length; i++){
        console.log(CLIENTS[i]);
      }
      broadcastResponse(rinfo.address);
    }
});
client.bind(PORTBT);
function broadcastResponse(ip){
  var client = new net.Socket();
  client.connect(PORT_CLIENT, ip, function() {
      console.log('CONNECTED TO: ' + ip + ':' + PORT_CLIENT);
      // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client
      client.write('discovered');
      client.destroy();
  });
  // Add a 'close' event handler for the client socket
  client.on('close', function() {
      console.log('Connection closed');
  });
}

//
net.createServer(function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    sock.on('data', function(data) {
      console.log('DATA: \n' + data);
      parsing(data);
    });
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });

}).listen(PORT, HOST);

//Parsing des données reçu
function parsing(data){

}

console.log('Server listening on ' + HOST +':'+ PORT);

//Interface web
app.get('/', function (req, res) {
  res.render('index.ejs', {clients: CLIENTS});
})

app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})

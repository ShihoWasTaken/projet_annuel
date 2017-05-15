var fs = require('fs');
    net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;
var FILEPATH = '/home/mathieu/hammerhead-m4b30z-factory-625c027b.zip';

var client = new net.Socket();
client.connect(PORT, HOST, function() {

    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    //send a file to the server
    var fileStream = fs.createReadStream(FILEPATH);
    fileStream.on('error', function(err){
        console.log(err);
    })

    fileStream.on('open',function() {
        fileStream.pipe(client);
    });

});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {

    console.log('DATA: ' + data);
    // Close the client socket completely
    client.destroy();

});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});

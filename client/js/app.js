/******************* VARS *******************/
var Inotify = require('inotify').Inotify;

const SIMULATE_SERVER = false;

var BROADCAST_PORT = 6024;
var BROADCAST_ADDR = "192.168.99.255";
var HOST = '0.0.0.0';
var PORT = 6969;
var arrayIpOfServers = [];
var arrayNameOfServers = [];
var isConnectedToServer = false;
/******************* END VARS *******************/


/******************* INOTIFY *******************/
var inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent 
 
var data = {}; //used to correlate two events 
 
var callback = function(event) {
    var mask = event.mask;
    var type = mask & Inotify.IN_ISDIR ? 'directory ' : 'file ';
    if (event.name) {
        type += ' ' + event.name + ' ';
    } else {
        type += ' ';
    }
 
    if (mask & Inotify.IN_ACCESS) {
        console.log(type + ' was accessed ');
    } else if (mask & Inotify.IN_MODIFY) {
        console.log(type + ' was modified ');
    } else if (mask & Inotify.IN_OPEN) {
        console.log(type + ' was opened ');
    } else if (mask & Inotify.IN_CLOSE_NOWRITE) {
        console.log(type + ' opened for reading was closed ');
    } else if (mask & Inotify.IN_CLOSE_WRITE) {
        console.log(type + ' opened for writing was closed ');
    } else if (mask & Inotify.IN_ATTRIB) {
        console.log(type + ' metadata changed ');
    } else if (mask & Inotify.IN_CREATE) {
        console.log(type + ' created');
    } else if (mask & Inotify.IN_DELETE) {
        console.log(type + ' deleted');
    } else if (mask & Inotify.IN_DELETE_SELF) {
        console.log(type + ' watched deleted ');
    } else if (mask & Inotify.IN_MOVE_SELF) {
        console.log(type + ' watched moved');
    } else if (mask & Inotify.IN_IGNORED) {
        console.log(type + ' watch was removed');
    } else if (mask & Inotify.IN_MOVED_FROM) {
        data = event;
        data.type = type;
    } else if (mask & Inotify.IN_MOVED_TO) {
        if ( Object.keys(data).length &&
            data.cookie === event.cookie) {
            console.log(type + ' moved to ' + data.type);
            data = {};
        }
    }
}
 
var home2_dir = {
    // Change this for a valid directory in your machine 
    path:      '/home/etudiant/client',
    watch_for: Inotify.IN_ALL_EVENTS,
    callback:  callback
};
        
var home2_wd = inotify.addWatch(home2_dir);

var serializer = new (require('xmldom')).XMLSerializer;
var implementation = new (require('xmldom')).DOMImplementation;

var document = implementation.createDocument('', '', null);

fs.writeFile(
  "/home/etudiant/test.xml", 
  serializer.serializeToString(document), 
  function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log("The file was saved!");
    }
  }
); 
/******************* END INOTIFY *******************/


/******************* BUTTONS *******************/
// Start Button
var dgram = require('dgram'); 
var dns = require('dns');
document.getElementById('btnBroadcast').onclick = function() {
    // On vide les listes pour ne pas stacker les serveurs si on spam le bouton
    arrayIpOfServers.length = 0;
    arrayNameOfServers.length = 0;

    var server = dgram.createSocket("udp4"); 
    server.bind(function() {
        server.setBroadcast(true);
        broadcastNew();
        //setInterval(broadcastNew, 3000);
    });

    function broadcastNew() {
        var message = new Buffer("discovery");
        server.send(message, 0, message.length, BROADCAST_PORT, BROADCAST_ADDR, function() {
            console.log("Sent '" + message + "'");
        });


                if (SIMULATE_SERVER) {
                    arrayNameOfServers.push("Arthas");
                    arrayNameOfServers.push("SERVERLAB");

                    arrayIpOfServers.push("192.168.1.1");
                    arrayIpOfServers.push("192.168.1.2");
                }
                // Suppression de la liste des serveurs affichée
                [].forEach.call(document.querySelectorAll('.li-server'),function(e){
                    e.parentNode.removeChild(e);
                });

                // Actualisation de la liste des serveurs
                for (var i = 0; i < arrayIpOfServers.length; i++) {
                    var ul = document.getElementById("listOfServers");

                    var li = document.createElement("li");

                    var a = document.createElement("a");
                    a.innerHTML = "Connect →";
                    a.setAttribute("id", "btnConnect"+arrayNameOfServers);
                    a.setAttribute("class", "withripple")  
                    a.setAttribute("href", "javascript:void(0)");

                    li.appendChild(document.createTextNode(arrayNameOfServers[i] + " (" + arrayIpOfServers[i] + ")"));
                    li.appendChild(a);

                    li.setAttribute("id", arrayNameOfServers[i]); // added line
                    li.setAttribute("class", "li-server next"); // added line

                    ul.appendChild(li);
                }
    }
    
    var net = require('net');

    // Create a server instance, and chain the listen function to it
    // The function passed to net.createServer() becomes the event handler for the 'connection' event
    // The sock object the callback function receives UNIQUE for each connection
    net.createServer(function(sock) {
        
        // We have a connection - a socket object is assigned to the connection automatically
        console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
        
        // Add a 'data' event handler to this instance of socket
        sock.on('data', function(data) {
            console.log('Message recu : ' + sock.remoteAddress + ': ' + data);
            if (data == "discovered") {
                arrayIpOfServers.push(sock.remoteAddress);
                /*dns.resolve4(sock.remoteAddress, (err, hostname) => {
                    if (err) throw err;
                    hostname.forEach((ip_address) => {
                        dns.reverse(ip_address, (err, hostname) => {
                            if (err) {
                                throw err;
                            }
                            var nomDuServeur = `${JSON.stringify(hostname[0])}`;
                            arrayNameOfServers.push(nomDuServeur);
                            console.log(`Reverse for ${ip_address}: ` + nomDuServeur);
                        });
                    });
                });*/

                // Suppression de la liste des serveurs affichée
                [].forEach.call(document.querySelectorAll('.li-server'),function(e){
                    e.parentNode.removeChild(e);
                });

                // Actualisation de la liste des serveurs
                for (var i = 0; i < arrayIpOfServers.length; i++) {
                    var ul = document.getElementById("listOfServers");

                    var li = document.createElement("li");

                    var a = document.createElement("a");
                    a.innerHTML = "Connect →";
                    a.setAttribute("id", "btnConnect");
                    a.setAttribute("class", "withripple");
                    a.setAttribute("href", "javascript:void(0)");
                    a.setAttribute("onclick", "javascript:connect(\""+arrayIpOfServers[i]+"\")");

                    li.appendChild(document.createTextNode(arrayIpOfServers[i]));
                    li.appendChild(a);

                    li.setAttribute("class", "li-server next"); // added line

                    ul.appendChild(li);
                }

            }
        });
        
        // Add a 'close' event handler to this instance of socket
        sock.on('close', function(data) {
            console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
        });
        
    }).listen(PORT, HOST);

    console.log('Server listening on ' + HOST +':'+ PORT);
};

// Connection au serveur
function connect(ipServer) {
    isConnectedToServer = true;
    var net = require('net');

    var client = new net.Socket();
    client.connect(PORT, ipServer, function() {
        client.write('shutdown');
    });
}


// Min
document.getElementById('windowControlMinimize').onclick = function()
{
    win.minimize();
};

// Close
document.getElementById('windowControlClose').onclick = function()
{
    win.close();
};

// Max
document.getElementById('windowControlMaximize').onclick = function()
{
    if (win.isMaximized)
        win.unmaximize();
    else
        win.maximize();
};

win.on('maximize', function(){
    win.isMaximized = true;
});

win.on('unmaximize', function(){
    win.isMaximized = false;
});
/******************* END BUTTONS *******************/
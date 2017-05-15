/******************* VARS *******************/
var Inotify = require('inotify').Inotify;

const SIMULATE_SERVER = false;

var BROADCAST_PORT = 6024;
var BROADCAST_ADDR = "192.168.99.255";
var HOST = '0.0.0.0';
var PORT_SEND = 6968;
var PORT_RECEIVE = 6969;

var FILEPATH = global.__dirname+'/output/output.txt';
var WATCHED_DIRECTORY = '/home/etudiant/client/projet_annuel/client';

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
        /*fs.appendFile(global.__dirname+'/output/output.txt', type + ' was accessed\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' was accessed');*/
    } else if (mask & Inotify.IN_MODIFY) {
        console.log(WATCHED_DIRECTORY + "/" + type + ' was modified');
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' was modified\n', function (err) {
            if (err) { console.log(err); }
        });
    } else if (mask & Inotify.IN_OPEN) {
        /*console.log(WATCHED_DIRECTORY + "/" + type + " was opened");
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' was opened\n', function (err) {
            if (err) { console.log(err); }
        });*/
    } else if (mask & Inotify.IN_CLOSE_NOWRITE) {
        /*console.log(WATCHED_DIRECTORY + "/" + type + ' opened for reading was closed');
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' opened for reading was closed\n', function (err) {
            if (err) { console.log(err); }
        });*/
    } else if (mask & Inotify.IN_CLOSE_WRITE) {
        console.log(WATCHED_DIRECTORY + "/" + type + ' openend for writing was closed');
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' opened for writing was closed\n', function (err) {
            if (err) { console.log(err); }
        });
    } else if (mask & Inotify.IN_ATTRIB) {
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' metadata changed\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' metadata changed');
    } else if (mask & Inotify.IN_CREATE) {
        console.log(type + ' created');
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' created\n', function (err) {
            if (err) { console.log(err); }
        });
    } else if (mask & Inotify.IN_DELETE) {
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' deleted\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' deleted');
    } else if (mask & Inotify.IN_DELETE_SELF) {
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' watched deleted\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' watched deleted');
    } else if (mask & Inotify.IN_MOVE_SELF) {
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' watched moved\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' watched moved');
    } else if (mask & Inotify.IN_IGNORED) {
        fs.appendFile(global.__dirname+'/output/output.txt', type + ' watch was moved\n', function (err) {
            if (err) { console.log(err); }
        });
        console.log(type + ' watch was moved');
    } else if (mask & Inotify.IN_MOVED_FROM) {
        data = event;
        data.type = type;
    } else if (mask & Inotify.IN_MOVED_TO) {
        if ( Object.keys(data).length &&
            data.cookie === event.cookie) {
                fs.appendFile(FILEPATH, type + ' moved to ' + data.type + '\n', function (err) {
                    if (err) { console.log(err); }
                });
                data = {};
        }
    }
}
 
var home2_dir = {
    path:      WATCHED_DIRECTORY,
    watch_for: Inotify.IN_ALL_EVENTS,
    callback:  callback
};
        
var home2_wd = inotify.addWatch(home2_dir);
/******************* END INOTIFY *******************/


/******************* BUTTONS *******************/
// Start Button
var dgram = require('dgram'); 
var dns = require('dns');
document.getElementById('btnBroadcast').onclick = function() {
    $('#footer').addClass('animated slideInUp visible');
    $('#footer').removeClass('invisible');
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
            a.setAttribute("id", "btnConnect"+i);
            a.setAttribute("class", "withripple")  
            a.setAttribute("href", "javascript:void(0)");
            a.setAttribute("onclick", "javascript:connect(\""+arrayIpOfServers[i]+"\")");

            li.appendChild(document.createTextNode(arrayIpOfServers[i]));
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
                    //a.setAttribute("onclick", "javascript:connect(\""+arrayIpOfServers[i]+"\")");

                    li.appendChild(document.createTextNode(arrayIpOfServers[i]));
                    li.appendChild(a);

                    li.setAttribute("class", "li-server next"); // added line

                    ul.appendChild(li);
                }

            }
        });
        
        // Add a 'close' event handler to this instance of socket
        sock.on('close', function(data) {
            console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
        });
        
    }).listen(PORT_RECEIVE, HOST);
};

// Connection au serveur
function connect(ipServer) {
    isConnectedToServer = true;
    var net = require('net');
    console.log("Connect to : " + ipServer);

    var client = new net.Socket();
    client.connect(PORT_SEND, ipServer, function() {
        (function() {
            var c = 0;
            var timeout = setInterval(function() {
                    
                //send a file to the server
                var fileStream = fs.createReadStream(FILEPATH);
                fileStream.on('error', function(err){
                    console.log(err);
                })

                fileStream.on('open',function() {
                    console.log("File sent");
                    fileStream.pipe(client);
                });

                fs.unlink(FILEPATH, (err) => {
                    if (err) throw err;
                        console.log('successfully deleted ' + FILEPATH);
                });


                // Création du fichier si non existant
                fs.open(FILEPATH,'r',function(err, fd){
                    if (err) {
                    fs.writeFile(FILEPATH, '', function(err) {
                        if(err) {
                            console.log(err);
                        }
                    });
                }});

            }, 10000);
        })();
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
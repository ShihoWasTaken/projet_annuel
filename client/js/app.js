/******************* VARS *******************/
var Inotify = require('inotify').Inotify;
var net = require('net');
var client = new net.Socket();

const SIMULATE_SERVER = false;

var BROADCAST_PORT = 6024;
var BROADCAST_ADDR = "192.168.99.255";
var HOST = '0.0.0.0';
var PORT_SEND = 6969;
var PORT_RECEIVE = 6968;

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
// Broadcast Button
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
    }
};


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

            // Suppression de la liste des serveurs affichée
            [].forEach.call(document.querySelectorAll('.li-server'),function(e){
                e.parentNode.removeChild(e);
            });

            // Actualisation de la liste des serveurs
            for (var i = 0; i < arrayIpOfServers.length; i++) {
                var ul = document.getElementById("listOfServers");

                var li = document.createElement("li");

                var a = document.createElement("a");
                a.innerHTML = "Connexion →";
                a.setAttribute("id", "btnConnect"+i);
                a.setAttribute("class", "withripple");
                a.setAttribute("href", "javascript:void(0)");
                a.setAttribute("onclick", "javascript:connect(this, \""+arrayIpOfServers[i]+"\")");

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


// Connection au serveur
function connect(btn, ipServer) {
    isConnectedToServer = true;
    console.log("Connect to : " + ipServer);

    // Animation pour informer que l'ordinateur est écouté
    $('#footer').addClass('animated slideInUp visible');
    $('#footer').removeClass('invisible');

    // Affichage du bouton disconnect
    var a = document.getElementById($(btn).attr('id'));
    a.innerHTML = "Déconnexion";
    a.setAttribute("id", "btnDisconnect");
    a.setAttribute("class", "btnDisconnect");
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("onclick", "javascript:disconnect(\""+ipServer+"\")");

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

// Déconnexion du serveur
function disconnect(ipServer) {
    client.destroy();
    console.log("Disconnect from : " + ipServer);

    // Animation pour informer que l'ordinateur est déconnecté
    $('#footer').addClass('animated slideOutDown visible');
    $('#footer').removeClass('insvisible');

    // Affichage du bouton disconnect
    var a = document.getElementById('btnDisconnect');
    a.innerHTML = "Connexion →";
    a.setAttribute("id", "btnConnect");
    a.setAttribute("class", "btnConnect");
    a.setAttribute("href", "javascript:void(0)");
    a.setAttribute("onclick", "javascript:connect(this, \""+ipServer+"\")");
    isConnectedToServer = false;
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
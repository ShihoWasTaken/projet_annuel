/********************************************/
/******************* VARS *******************/
/********************************************/
const SIMULATE_SERVER = false;
const DEBUG = true;

var BROADCAST_PORT = 6024;
var BROADCAST_ADDR = "192.168.99.255";
var HOST = '0.0.0.0';
var PORT_SEND = 6969;
var PORT_RECEIVE = 6968;

var WATCHED_DIRECTORY = '/home/etudiant/client/projet_annuel/client';
var CONFIG = null;
var arrayOfEvents = [];
var arrayOfScreens = [];

var arrayServers = [];
var isConnectedToServer = false;
var timeStampStart = 0;

var chokidar = require('chokidar');
var net = require('net');
var dgram = require('dgram'); 
var dns = require('dns');
var io = require('socket.io-client');
const username = require('username');
var ssdp = require("node-ssdp").Client, client = new ssdp();
var screenshot = require('desktop-screenshot');
var screenStreamer = require('screen-streamer');

var socket;

var btnBroadcast = document.getElementById('btnBroadcast');
/************************************************/
/******************* END VARS *******************/
/************************************************/










/***********************************************/
/******************* HELPERS *******************/
/***********************************************/
function log(txt) {
    if (DEBUG == true) {
        console.log(txt);
    }
}
/***************************************************/
/******************* END HELPERS *******************/
/***************************************************/








/**********************************************/ 
/******************* EVENTS *******************/
/**********************************************/
// Initialize watcher. 
function watchEvents() {

    var watcher = chokidar.watch(WATCHED_DIRECTORY, {
        persistent: true,
        ignoreInitial: true,
        ignored: '/home/etudiant/client/projet_annuel/client/pnacl/*',
    });

    // Add event listeners. 
    watcher
    .on('add', (path) => {
            var event = 
                {
                    "time": Date.now() - timeStampStart,
                    "action": "Create",
                    "file": path.toString()
                };
            arrayOfEvents.push(event);
            log(path);
        })
    .on('change', (path) => {
            var event = 
                {
                    "time": Date.now() - timeStampStart,
                    "action": "Modify",
                    "file": path.toString()
                };
            arrayOfEvents.push(event);
            log(`Modify file : ${path}`);
        })
    .on('unlink', (path) => {
            var event = 
                {
                    "time": Date.now() - timeStampStart,
                    "action": "Delete",
                    "file": path.toString()
                };
            arrayOfEvents.push(event);
            log(`Delete file : ${path}`);
        })
    .on('addDir', (path) => {
            var event = 
                {
                    "time": Date.now() - timeStampStart,
                    "action": "Create",
                    "file": path.toString()
                };
            arrayOfEvents.push(event);
            log(`Add Directory : ${path}`);
        })
    .on('unlinkDir', (path) => {
            var event = 
                {
                    "time": Date.now() - timeStampStart,
                    "action": "Delete",
                    "file": path.toString()
                };
            arrayOfEvents.push(event);
            log(`Delete Directory : ${path}`);
        });

    watcher.unwatch('/home/etudiant/client/projet_annuel/client/screenshot/*');
}
/**************************************************/
/******************* END EVENTS *******************/
/**************************************************/










/***********************************************/
/******************* CAPTURE *******************/
/***********************************************/

function captureScreen() {
    var _height = CONFIG.video.resolution.split('x')[1];
    var _width = CONFIG.video.resolution.split('x')[0];
    var ips = CONFIG.video.imagesPerSeconds;
    var timeOut = 1000/ips;

    console.log(ips);

        var screenStreamer = require('screen-streamer');
        var fs = require('fs');
        var fileIndex = 0;

        screenStreamer({
            width: _width,
            height: _height,
            fps: ips,
            duration: 86400,
            format: 'jpeg',
            quality: 50,
        }, function(err, buffer){
            if (err) throw err;

            username().then(username => {
                socket.emit('image', { image: true, buffer: buffer, user: username, time: Date.now() });
            });
        });

}
/***************************************************/
/******************* END CAPTURE *******************/
/***************************************************/










/*************************************************/
/******************* BROADCAST *******************/
/*************************************************/
// Appel du broadcast au chargement du logiciel
broadcast();

function broadcast() {
    arrayServers.length = 0;
    btnBroadcast.disabled = true;
    client.on('response', function inResponse(headers, code, rinfo) {
        if (!containsObject(rinfo, arrayServers)) {
            log('Réponse d\'un serveur : \n%d\n%s\n%s', code, JSON.stringify(headers, null, '  '), JSON.stringify(rinfo, null, '  '));
            arrayServers.push(rinfo);
        }
    });

    // On recherche un serveur compatible
    client.search('urn:schemas-upnp-org:service:ProjetAnnuel:1');

    // Stop après 3 secondes
    setTimeout(function () {
        btnBroadcast.disabled = false;
        log("Client stop");
        client.stop()
        connectAfterBroadcast(arrayServers);
    }, 3000);
}

// Si le logiciel est lancé avant le serveur, on peut relancer le broadcast avec le bouton
btnBroadcast.onclick = function() {
    broadcast();
};

// Check if the arraylist contains the object
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].address === obj.address) {
            return true;
        }
    }

    return false;
}
/*****************************************************/
/******************* END BROADCAST *******************/
/*****************************************************/








/************************************************************/
/******************* CONNECT / DISCONNECT *******************/
/************************************************************/
// Gestion de un ou plusieurs serveurs (si un seul alors connexion automatique)
function connectAfterBroadcast(arrayServers) {
    if (arrayServers.length == 1) { // Un seul serveur, connexion automatique
        connectTo(arrayServers[0].address);

    } else if (arrayServers.length > 1) { // Plus d'un serveur alors on propose la liste de connexion
        // Suppression de la liste des serveurs affichée
        [].forEach.call(document.querySelectorAll('.li-server'),function(e){
            e.parentNode.removeChild(e);
        });

        // Actualisation de la liste des serveurs
        for (var i = 0; i < arrayServers.length; i++) {
            var ul = document.getElementById("listOfServers");

            var li = document.createElement("li");

            var a = document.createElement("a");
            a.innerHTML = "Connexion →";
            a.setAttribute("id", "btnConnect"+i);
            a.setAttribute("class", "withripple");
            a.setAttribute("href", "javascript:void(0)");
            a.setAttribute("onclick", "javascript:connectTo(\""+arrayServers[i].address+"\", this)");

            li.appendChild(document.createTextNode(arrayServers[i].address));
            li.appendChild(a);

            li.setAttribute("class", "li-server next"); // added line

            ul.appendChild(li);
        }
    }
}

// Déconnexion du serveur
function disconnect(ipServer) {
    client.destroy();
    log("Disconnect from : " + ipServer);

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
/****************************************************************/
/******************* END CONNECT / DISCONNECT *******************/
/****************************************************************/









/**********************************************/
/******************* SOCKET *******************/
/**********************************************/
// Connection au serveur
function connectTo(ipServer, btn = null) {
    socket = io.connect("http://" + ipServer + ":" + PORT_SEND);

    // On connect, on envoie l'user au serveur
    socket.on('connect', () => {
    });

    // Réception de la configuration
    socket.on('config', function (config) {
        CONFIG = config;
        log("Réception de config : " + CONFIG);
        log("Connexion au serveur, démarrage du timer");    
        isConnectedToServer = true;
        showYouAreListening();
        timeStampStart = Date.now();
        watchEvents();
        captureScreen();
        username().then(username => {
            socket.emit('user', username);
        });
    });

    // Envoie régulier des événements
    var timeout = setInterval(function() {
        username().then(username => {
            var jsonToSend = {
                "user": username,
                "event": []
            };
            for (var i = 0; i < arrayOfEvents.length; i++) {
                jsonToSend.event.push(arrayOfEvents[i]);
            }
            if (arrayOfEvents.length != 0) {
                socket.emit('events', jsonToSend);
            }
            log("Event emited");
            arrayOfEvents.length = 0;
        });
    }, 3000);
}
/**************************************************/
/******************* END SOCKET *******************/
/**************************************************/










/***********************************************/
/******************* UI *******************/
/***********************************************/
function showYouAreListening() {
    var footer = document.getElementById('footer');
    footer.className += ' visible animate slideInUp';
    footer.classList.remove('invisible');
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
/***************************************************/
/******************* END UI *******************/
/***************************************************/












/**********************************************/
/******************* EVENTS *******************/
/**********************************************/
win.on( 'close', function() {
    win.minimize();
} );

win.on('maximize', function(){
    win.isMaximized = true;
});

win.on('unmaximize', function(){
    win.isMaximized = false;
});
/**************************************************/
/******************* END EVENTS *******************/
/**************************************************/
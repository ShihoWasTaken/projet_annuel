/********************************************/
/******************* VARS *******************/
/********************************************/
var chokidar = require('chokidar');
var io = require('socket.io-client');
const username = require('username');
var ssdp = require("node-ssdp").Client, client = new ssdp();
var child_process = require('child_process');
var os = require('os');

const DEBUG = true;

var PORT_SEND = 6969;
var SERVER_IP_ADDRESS = null;

var WATCHED_DIRECTORY = os.homedir()/*+'/client/projet_annuel/nodejs_client'*/;
var CONFIG = null;
var arrayOfEvents = [];

var arrayServers = [];
var isConnectedToServer = false;
var timeStampStart = 0;
var process_ffmpeg = null;

var socket;
var watcher;

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
if (DEBUG == true) {
    win.showDevTools();
}
/***************************************************/
/******************* END HELPERS *******************/
/***************************************************/











/**********************************************/ 
/******************* EVENTS *******************/
/**********************************************/
// Initialize watcher. 
function watchEvents() {

    watcher = chokidar.watch(WATCHED_DIRECTORY, {
        persistent: true,
        ignoreInitial: true,
        ignored: WATCHED_DIRECTORY + '/.*',
        usePolling: true,
        useFsEvents: true,
    });

    // Add event listeners (if true in config)
    if (CONFIG.inotify.add) {
        watcher.on('add', (path, stats) => {
            var event = 
                {
                    "time": (Date.now() - timeStampStart) + CONFIG.time,
                    "action": "Create",
                    "file": path.toString(),
                    "size": stats.size
                };
            //arrayOfEvents.push(event);
            socket.emit('events', event);
            log(path);
        });
    }
    if (CONFIG.inotify.change) {
        watcher.on('change', (path, stats) => {
            var event = 
                {
                    "time": (Date.now() - timeStampStart) + CONFIG.time,
                    "action": "Modify",
                    "file": path.toString(),
                    "size": stats.size
                };
            //arrayOfEvents.push(event);
            socket.emit('events', event);
            log(`Modify file : ${path}`);
        });
    }
    if (CONFIG.inotify.unlink) {
        watcher.on('unlink', (path) => {
            var event = 
                {
                    "time": (Date.now() - timeStampStart) + CONFIG.time,
                    "action": "Delete",
                    "file": path.toString()
                };
            //arrayOfEvents.push(event);
            socket.emit('events', event);
            log(`Delete file : ${path}`);
        });
    }
    if (CONFIG.inotify.addDir) {
        watcher.on('addDir', (path, stats) => {
            var event = 
                {
                    "time": (Date.now() - timeStampStart) + CONFIG.time,
                    "action": "Create",
                    "file": path.toString(),
                    "size": stats.size
                };
            //arrayOfEvents.push(event);
            socket.emit('events', event);
            log(`Add Directory : ${path}`);
        });
    }
    if (CONFIG.inotify.unlinkDir) {
        watcher.on('unlinkDir', (path) => {
            var event = 
                {
                    "time": (Date.now() - timeStampStart) + CONFIG.time,
                    "action": "Delete",
                    "file": path.toString()
                };
            //arrayOfEvents.push(event);
            socket.emit('events', event);
            log(`Delete Directory : ${path}`);
        });
    }
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

    var exec = child_process.exec;
    function puts(error, stdout, stderr) { console.log(stdout) }
    var command = "ffmpeg -video_size "+screen.width+"x"+screen.height+" -framerate "+ips+" -f x11grab -i :0.0+0,0 -vcodec "+CONFIG.video.encoding+" -vf scale="+_width+":"+_height+" -f avi -pix_fmt yuv420p 'udp://"+SERVER_IP_ADDRESS+":"+CONFIG.video.port+"'";
    log(command);
    process_ffmpeg = exec(command, puts);
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
        win.setResizable(true);
        win.resizeBy(150, 300);

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
    watcher.close();
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
    if (win.resizable == true) {
        win.resizeBy(500, 150);
        win.setResizable(false);    
    }

    socket = io.connect("http://" + ipServer + ":" + PORT_SEND);
    SERVER_IP_ADDRESS = ipServer;

    socket.on('connect', function () {
        btnBroadcast.disabled = true;
        btnBroadcast.innerHTML = "Vous êtes écouté";
        username().then(username => {
            socket.emit('user', username);
        });
    });

    socket.on('disconnect', function () {
        btnBroadcast.disabled = false;
        btnBroadcast.innerHTML = "Recherche de serveur";
        log("Disconnect : Kill du ffmpeg");
        var exec = child_process.exec;
        exec("killall ffmpeg");
        hideYouAreListening();
    });

    // Réception de la configuration
    socket.on('config', function (config) {
        CONFIG = config;
        log("Réception de config avec options update : " + CONFIG.inotify.change);
        isConnectedToServer = true;
        showYouAreListening();
        timeStampStart = Date.now();
        watchEvents();
        captureScreen();
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
function hideYouAreListening() {
    var footer = document.getElementById('footer');
    footer.className += ' invisible animate slideOutDown';
    footer.classList.remove('visible');
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
/***************************************************/
/******************* END UI ************************/
/***************************************************/












/**********************************************/
/******************* EVENTS *******************/
/**********************************************/
win.on('close', function() {
    var exec = child_process.exec;
    exec("killall ffmpeg");
    watcher.close();
    alert('En quittant, une alerte sera envoyée au serveur');
    win.close(true); 
});

win.on('maximize', function(){
    win.isMaximized = true;

});

win.on('unmaximize', function(){
    win.isMaximized = false;
});
/**************************************************/
/******************* END EVENTS *******************/
/**************************************************/
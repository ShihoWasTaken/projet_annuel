#!/usr/bin/env node
var fs = require('fs'),
    net = require('net'),
    buffer = require('buffer'),
    stream = require('stream'),
    argv = require('yargs').argv,
    sqlite3 = require('sqlite3').verbose(),
    redis = require('socket.io-redis');
    spawn = require('child_process').spawn;
//*********************************************//
//**********Gestion des arguments*************//
//*******************************************//
var argv = require('yargs')
          .usage('$0 [options]')
          .demandOption(['s'])
          .describe('s', 'Nom de la session')
          .describe('p', 'Port d\'écoute')
          .describe('f', 'Premier port d\'écoute pour ffmpeg')
          .describe('i', 'Images par seconde')
          .describe('c', 'Codec video')
          .describe('r', 'Résolution vidéo')
          .describe('d', 'Désactiver les évènements de suppression')
          .describe('a', 'Désactiver les évènements de création')
          .describe('u', 'Désactiver les évènements de modification')
          .help('h')
          .alias('h', 'help')
          .alias('s', 'session')
          .alias('p','port')
          .alias('d','delete')
          .alias('a','create')
          .alias('u','update')
          .default('p', 6969)
          .default('f', 7000)
          .default('i', 5)
          .default('c', 'libx264')
          .default('r', '960x540')
          .help()
          .argv
//*********************************************//
//**********End Gestion des arguments*********//
//*******************************************//


var HOST = '0.0.0.0';
var PORT = argv.p;
var PORT_FFMPEG = argv.f;
var CLIENTS = [];
var SESSION = argv.s;
var IPS = argv.i;
var CODEC = argv.c;
var RESOLUTION = argv.r;
var START_TIME = Date.now();
var runs = [];
var COUNT_EXEC = 0;

// Gestion inotify
var remove = true;
var create = true;
var update = true;

if(argv.a){
  create = false
}
if(argv.d){
  remove = false
}
if(argv.u){
  update = false
}

var DIRECTORY = 'bundles/app/uploads/';
var WORKING_DIRECTORY = DIRECTORY+SESSION;

fs.stat(WORKING_DIRECTORY, function (err, stats){
  if (err) {
    // Directory doesn't exist or something.
    return fs.mkdir(WORKING_DIRECTORY, function(){
      console.log('Folder '+WORKING_DIRECTORY+' created\n');
      main();
    });
  }
  if (!stats.isDirectory()) {
    // This isn't a directory!
    callback(new Error(WORKING_DIRECTORY + ' is not a directory!'));
  } else {
    main();
  }
});

function main(){
  //****************************************************//
  //*****************Broadcast Part********************//
  //**************************************************//
  var SSDP = require('node-ssdp').Server,
  server = new SSDP({
    sourcePort: 1900,
  });

  server.addUSN('urn:schemas-upnp-org:service:ProjetAnnuel:1');

  // start server on all interfaces
  server.start();

  //****************************************************//
  //***************End Broadcast Part******************//
  //**************************************************//

  //****************************************************//
  //***************Communication Part******************//
  //**************************************************//
  var io = require('socket.io')(PORT);

  var config = {
    "video":{
      "imagesPerSeconds": IPS,
      "resolution": RESOLUTION,
      "encoding": CODEC,
      "port": 0
    },
    "inotify":{
      "add":create,
      "change":update,
      "unlink":remove,
      "addDir":create,
      "unlinkDir":remove
    },
    "time":0
  }

  var people = {};
  io.on('connection', function (socket) {
    socket.on('disconnect', function() {
      user = people[socket.id].name;
      console.log(user + ' disconnected');
      var time = Date.now()-(people[socket.id].connected_on)
      db.run("UPDATE students set connected = 0, disconnect_on = disconnect_on+"+ time +" WHERE username = '"+user+"';");
      delete people[socket.id];
    });

    socket.on('user', function(user){
      people[socket.id] = {
                            'name':user,
                            'connected_on':Date.now()
                          };
      console.log(user + " connected !!");
      var userDirectory = WORKING_DIRECTORY+'/'+user
      fs.stat(userDirectory, function (err, stats){
        if (err) {
          // Directory doesn't exist or something.
          console.log('Folder '+userDirectory+' created\n');
          return fs.mkdirSync(userDirectory);
        }
      });
      db.all("SELECT COUNT(*) AS COUNT FROM students WHERE username = '"+user+"'",function(err,rows){
        if(rows[0].COUNT == 0){
          var stmt = db.prepare("INSERT INTO students(username,connected,port,disconnect_on) VALUES (?,?,?,?)");
          stmt.run(user, 1, PORT_FFMPEG, 0);
          runs[COUNT_EXEC] = spawn('ffmpeg', ['-i', 'udp://localhost:'+PORT_FFMPEG, '-c', 'copy',userDirectory+'/'+user+'.avi']);
          config.video.port = PORT_FFMPEG;
          config.time = 0;
          PORT_FFMPEG++;
          COUNT_EXEC++;
          socket.emit('config', config);
        }
        else{
          db.run("UPDATE students set connected = 1 WHERE username = '"+user+"';");
          db.all("SELECT port, disconnect_on FROM students WHERE username = '"+user+"'",function(err,rows){
            config.time = rows[0].disconnect_on;
            config.video.port = rows[0].port;
            socket.emit('config', config);
          });
        }

      });
    });

    socket.on('events', function(events){
      console.log(events);
      parsing(events, people[socket.id].name);
    });
  });


  //stockage des events reçus
  function parsing(data, user){
    var student, action, time, file, stmt;
    db.all("SELECT id FROM students WHERE username = '"+user+"'",function(err,rows){
      student = rows[0].id;
      stmt = db.prepare("INSERT INTO events(student, file, action, size, time) VALUES (?,?,?,?,?)");
      action = data.action;
      time = data.time;
      file = data.file;
      size = 0;
      if(data.size){
        size = data.size;
      }
      stmt.run(student, file, action, size, time);
    });
  }

  console.log('-> Server listening for connections on ' + PORT+ '\n');

  //****************************************************//
  //*************End Communication Part****************//
  //**************************************************//

  //****************************************************//
  //********************SQLite Part********************//
  //**************************************************//


  var db = new sqlite3.Database(WORKING_DIRECTORY+"/database.sqlite");

  db.serialize(function() {
    db.run("CREATE TABLE students (`id`	INTEGER PRIMARY KEY AUTOINCREMENT,  `username` TEXT, 'port' INTEGER, 'connected' INTEGER, 'disconnect_on' INTEGER)");
    db.run("CREATE TABLE `events`(`id`	INTEGER PRIMARY KEY AUTOINCREMENT, `student` INTEGER, `file`	TEXT, `action`	TEXT, `size` INTEGER, `time`	INTEGER, FOREIGN KEY(`student`) REFERENCES `students.id`);");

  });

  //****************************************************//
  //*****************End SQLite Part*******************//
  //**************************************************//


  function exitHandler(err) {
    runs.forEach(elem => {
      elem.kill()
    });
    if (err) console.log(err.stack);
    process.exit();
  }

  //do something when app is closing
  process.on('exit', exitHandler.bind());

  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind());

  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind());
}

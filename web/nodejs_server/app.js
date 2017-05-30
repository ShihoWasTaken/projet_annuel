#!/usr/bin/env node
var fs = require('fs'),
    net = require('net'),
    buffer = require('buffer'),
    stream = require('stream'),
    argv = require('yargs').argv,
    sqlite3 = require('sqlite3').verbose(),
    redis = require('socket.io-redis');
    exec = require('child_process').exec;
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

var DIRECTORY = '';
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
    //unicastHost: '192.168.11.63',
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
    //console.log('connection !!');


    socket.on('disconnect', function() {
      user = people[socket.id].name;
      console.log(user + ' disconnected');
      // io.emit('notification', people[socket.id] + ' a été déconnecté du serveur');
      var time = Date.now()-(people[socket.id].connected_on)
      db.run("UPDATE students set connected = 0, disconnect_on = disconnect_on+"+ time +" WHERE student = '"+user+"';");
      delete people[socket.id];
    });

    socket.on('user', function(user){
      console.log(user + " connected !!");
      var userDirectory = WORKING_DIRECTORY+'/'+user
      fs.stat(userDirectory, function (err, stats){
        if (err) {
          // Directory doesn't exist or something.
          console.log('Folder '+userDirectory+' created\n');
          return fs.mkdirSync(userDirectory);
        }
      });
      db.all("SELECT COUNT(*) AS COUNT FROM students WHERE student = '"+user+"'",function(err,rows){
        if(rows[0].COUNT == 0){
          var stmt = db.prepare("INSERT INTO students(student,connected,port,disconnect_on) VALUES (?,?,?,?)");
          stmt.run(user, 1, PORT_FFMPEG, 0);
          exec('ffmpeg -i udp://localhost:'+PORT_FFMPEG+' -c copy '+ userDirectory+'/'+user+'.avi');
          config.video.port = PORT_FFMPEG;
          config.time = 0;
          PORT_FFMPEG++;
          socket.emit('config', config);
        }
        else{
          db.run("UPDATE students set connected = 1 WHERE student = '"+user+"';");
          db.all("SELECT port, disconnect_on FROM students WHERE student = '"+user+"'",function(err,rows){
            config.time = rows[0].disconnect_on;
            config.video.port = rows[0].port;
            socket.emit('config', config);
          });
        }
        people[socket.id] = {
                              'name':user,
                              'connected_on':Date.now()
                            };
      });
    });

    socket.on('events', function(events){
      console.log(events);
      parsing(events);
    });
  });

  // io.adapter(redis({ host: '127.0.0.1', port: 6379 }));

  //Parsing des events reçus
  function parsing(data){
        var student, action, time, file, stmt;
    db.all("SELECT id FROM students WHERE student = '"+data.user+"'",function(err,rows){
        student = rows.id;
    });

    for(var i=0; i<data.event.length;i++){
      stmt = db.prepare("INSERT INTO events(student, file, action, time) VALUES (?,?,?,?)");
      action = data.event[i].action;
      time = data.event[i].time;
      file = data.event[i].file;
      stmt.run(1, file, action, time);
    }
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
    db.run("CREATE TABLE students (`id`	INTEGER PRIMARY KEY AUTOINCREMENT,  `student` TEXT, 'port' INTEGER, 'connected' INTEGER, 'disconnect_on' INTEGER)");
    db.run("CREATE TABLE `events`(`id`	INTEGER PRIMARY KEY AUTOINCREMENT, `student` INTEGER, `file`	TEXT, `action`	TEXT, `time`	INTEGER, FOREIGN KEY(`student`) REFERENCES `students.id`);");

  });

  //****************************************************//
  //*****************End SQLite Part*******************//
  //**************************************************//
}

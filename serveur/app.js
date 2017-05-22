#!/usr/bin/env node
var fs = require('fs'),
    net = require('net'),
    buffer = require('buffer'),
    stream = require('stream'),
    argv = require('yargs').argv,
    sqlite3 = require('sqlite3').verbose(),
    redis = require('socket.io-redis');

//*********************************************//
//**********Gestion des arguments*************//
//*******************************************//
var argv = require('yargs')
          .usage('$0 [options]')
          .demandOption(['s'])
          .describe('s', 'Nom de la session')
          .describe('p', 'Port d\'écoute')
          .help('h')
          .alias('h', 'help')
          .alias('s', 'session')
          .alias('p','port')
          .help()
          .argv
//*********************************************//
//**********End Gestion des arguments*********//
//*******************************************//


var HOST = '0.0.0.0';
var PORT = 6969;
var PORT_CLIENT = 6968;
var FILEPATH = "/home/mathieu/Documents/"
var CLIENTS = [];
var SESSION = argv.s;


fs.stat(SESSION, function (err, stats){
  if (err) {
    // Directory doesn't exist or something.
    console.log('Folder '+SESSION+' created\n');
    return fs.mkdir(SESSION, function(){
      main();
    });
  }
  if (!stats.isDirectory()) {
    // This isn't a directory!
    callback(new Error(SESSION + ' is not a directory!'));
  } else {
    console.log('!! ERROR '+SESSION + ' already exists !!');
    process.exit();
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
      "imagesPerSeconds": 1,
      "resolution": "1920x1080",
      "encoding": "x265",
    },
    "inotify":{
      "options":false
    }
  }
  var people = {};
  io.on('connection', function (socket) {
    //console.log('connection !!');
    socket.emit('config', config);

    socket.on('disconnect', function() {
      user = people[socket.id];
      console.log(people[socket.id] + ' disconnected');
      // io.emit('notification', people[socket.id] + ' a été déconnecté du serveur');
      db.run("UPDATE students set connected = 0 WHERE student = '"+user+"';");
      delete people[socket.id];
    });

    socket.on('user', function(user){
      people[socket.id] = user;
      console.log(user + " connected !!");
      var userDirectory = SESSION+'/'+user
      fs.stat(userDirectory, function (err, stats){
        if (err) {
          // Directory doesn't exist or something.
          console.log('Folder '+userDirectory+' created\n');
          return fs.mkdirSync(userDirectory);
        }
      });
      db.all("SELECT COUNT(*) AS COUNT FROM students WHERE student = '"+user+"'",function(err,rows){
        if(rows[0].COUNT == 0){
          var stmt = db.prepare("INSERT INTO students(student,connected) VALUES (?,?)");
          stmt.run(user, 1);
        }
        else{
          db.run("UPDATE students set connected = 1 WHERE student = '"+user+"';");
        }
      });
    });

    socket.on('events', function(events){
      console.log(events);
      parsing(events);
    });

    socket.on('image', function(image) {
      console.log("Image reçu !");
      console.log(image);
      var directory, user, time, file;
      if(image.image){
        user = image.user;
        directory = SESSION + "/" + user + "/";
        time = image.time;
        file = directory + time + ".jpg";
        fs.writeFile(file, image.buffer, 'binary', function(err) {
          if(err)
            console.log(err);
          else
            console.log("The file was saved to " + file);
        });
      }
    })
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


  var db = new sqlite3.Database(SESSION+"/database.db");

  db.serialize(function() {
    db.run("CREATE TABLE students (`id`	INTEGER PRIMARY KEY AUTOINCREMENT,  `student` TEXT, 'connected' INTEGER)");
    db.run("CREATE TABLE `events`(`id`	INTEGER PRIMARY KEY AUTOINCREMENT, `student` INTEGER, `file`	TEXT, `action`	TEXT, `time`	INTEGER, FOREIGN KEY(`student`) REFERENCES `students.id`);");

  });

  //****************************************************//
  //*****************End SQLite Part*******************//
  //**************************************************//
}

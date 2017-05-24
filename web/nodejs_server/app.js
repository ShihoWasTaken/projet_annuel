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
          .help('h')
          .alias('h', 'help')
          .alias('s', 'session')
          .alias('p','port')
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
      "add":true,
      "change":true,
      "unlink":true,
      "addDir":true,
      "unlinkDir":true
    }
  }
  var people = {};
  io.on('connection', function (socket) {
    //console.log('connection !!');


    socket.on('disconnect', function() {
      user = people[socket.id].name;
      console.log(user + ' disconnected');
      // io.emit('notification', people[socket.id] + ' a été déconnecté du serveur');
      db.run("UPDATE student set connected = 0 WHERE username = '"+user+"';");
      delete people[socket.id];
    });

    socket.on('user', function(user){

      config.video.port = PORT_FFMPEG;
      people[socket.id] = {
                            'name':user,
                            'port':config.video.port
                          };
      PORT_FFMPEG++;
      socket.emit('config', config);


      console.log(user + " connected !!");
      var userDirectory = WORKING_DIRECTORY+'/'+user
      fs.stat(userDirectory, function (err, stats){
        if (err) {
          // Directory doesn't exist or something.
          console.log('Folder '+userDirectory+' created\n');
          return fs.mkdirSync(userDirectory);
        }
      });
      db.all("SELECT COUNT(*) AS COUNT FROM student WHERE username = '"+user+"'",function(err,rows){
        if(rows[0].COUNT == 0){
          var stmt = db.prepare("INSERT INTO student(username,connected) VALUES (?,?)");
          stmt.run(user, 1);
          exec('ffmpeg -i udp://localhost:'+people[socket.id].port+' -c copy '+ userDirectory+'/'+user+'.mkv')
        }
        else{
          db.run("UPDATE student set connected = 1 WHERE username = '"+user+"';");
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
        directory = WORKING_DIRECTORY + "/" + user + "/";
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
    var isBuffering = false;
    var wstream;
    socket.on('video', function(data) {
        if(!isBuffering){
            wstream = fs.createWriteStream('fooTest.flv');
            isBuffering = true;
        }
        buffer = new Buffer(data);
        fs.appendFile('fooTest.flv', buffer, function (err) {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });
    });

  });

  // io.adapter(redis({ host: '127.0.0.1', port: 6379 }));

  //Parsing des events reçus
  function parsing(data){
        var student, action, time, file, stmt;
    db.all("SELECT id FROM student WHERE username = '"+data.user+"'",function(err,rows){
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
    db.run("CREATE TABLE `student` (`id`	INTEGER PRIMARY KEY AUTOINCREMENT,  `username` TEXT, 'connected' INTEGER)");
    db.run("CREATE TABLE `events`(`id`	INTEGER PRIMARY KEY AUTOINCREMENT, `student_id` INTEGER, `file`	TEXT, `action`	TEXT, `time`	INTEGER, FOREIGN KEY(`student_id`) REFERENCES `student.id`);");

  });

  //****************************************************//
  //*****************End SQLite Part*******************//
  //**************************************************//
}

var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var command = ffmpeg('/home/mathieu/Documents/projet-annuel/serveur/test/etudiant/%03d.jpg');



const testFolder = '/home/mathieu/Documents/projet-annuel/serveur/test/etudiant/';
// var stream  = fs.createWriteStream(testFolder+'outputfile.mkv');

command.output('your_target.avi')
      .videoCodec('libx264')
      .fps(2)
      .on('stderr', function(stderrLine) {
        console.log('Stderr output: ' + stderrLine);
      });
      // .on('progress', function(progress) {
      //   console.log('Processing: ' + progress.percent + '% done');
      // });


// fs.readdir(testFolder, (err, files) => {
//   files.forEach(file => {
//     console.log(file);
//     command.addInput(testFolder+file);
//   });
// })
command.run();

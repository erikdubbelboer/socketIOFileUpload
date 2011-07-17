
var http        = require('http'),
    fs          = require('fs'),
    querystring = require('querystring'),
    io          = require('socket.io');



// Uncomment this to catch all exceptions so the server doesn't crash.
process.on('uncaughtException', function (err) {
  console.log('uncaught exception: ' + err);
});



// Allowed content types and extensions.
var allowedTypes = {
  'text/javascript': 'js',
  'text/css':        'css',

  'image/png':       'png',
  'image/jpeg':      'jpg',
  'image/gif':       'gif',
  'text/plain':      'txt'
};

var allowedExtensions = []; // Array of allowed extensions.
var contentTypes      = {}; // Reverse lookup of allowedTypes.

for (ct in allowedTypes) {
  allowedExtensions[allowedExtensions.length] = allowedTypes[ct];

  contentTypes[allowedTypes[ct]] = ct;
}

// RegExp to test for valid files (only the ones in allowedTypes).
// Files must be in a subdirectory so users can't access the javascript files for nodejs.
var validFile = new RegExp('^\/[a-z]+\/[0-9a-z\-]+\.('+allowedExtensions.join('|')+')$');



var server = http.createServer(function(req, res) {
  // Serve all allowed files.
  if (validFile.test(req.url)) {
    // substr(1) to strip the leading /
    fs.readFile(req.url.substr(1), function(err, data) {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('File not found.');
      } else {
        var ext = req.url.substr(req.url.lastIndexOf('.') + 1);

        res.writeHead(200, {
          'Content-Type'          : contentTypes[ext],
          'X-Content-Type-Options': 'nosniff' // We are server user uploaded content so make sure our content type is used instead of sniffing.
        });
        res.end(data);
      }
    });

    return;
  }


  res.writeHead(200, {'Content-Type': 'text/html'});

  // Server index.html
  fs.readFile('index.html', function(err, data) {
    res.end(data);
  });
});


server.listen(8082);


var socket = io.listen(server);

// Set socket.io logging to normal (comment to get verbose logging).
// With verbose logging it will log the whole file content.
socket.set('log level', 1);

socket.sockets.on('connection', function(client) {
  client.on('message', function(data) {
    // data is an URL data scheme with base64 encoding (http://tools.ietf.org/html/rfc2397).
    data = data.split(';base64,');

    var type = data[0].substr(5); // strip the data:

    if (!allowedTypes[type]) {
      return;
    }

    // Decode the base64 data to binary.
    data = new Buffer(data[1], 'base64').toString('binary');

    // Get the number of files in the upload dir.
    fs.readdir('uploads', function(err, files) {
      // Create a new file with a number as name that is one higher then the current amount of files in the uploads directory.
      var name = 'uploads/'+files.length+'.'+allowedTypes[type];

      fs.writeFile(name, data, 'binary', function(err) {
        console.log(name+' uploaded');

        // Send the filename to the client.
        client.send(name);
      });
    });
  });
});


// Never let something run as root when it's not needed!
if (process.getuid() == 0) {
  process.setgid('www-data');
  process.setuid('www-data');
}


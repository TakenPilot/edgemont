var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var bluebird = require('bluebird');
var fs = bluebird.promisifyAll(require('fs'));


var log = function () {};

app.use(express.static(path.join(__dirname, 'dist')));

io.on('connection', function (socket) {
  log = function (data) {
    console.log(data);
    if (socket) {
      socket.emit('log', data);
    }
  };

  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    log(data);
  });
  socket.on('disconnect', function(){
    log('user disconnected');
  });
  socket.on('get styles', function (data) {
    fs.readFileAsync('src/style.css', {encoding: 'UTF8'}).then(function (data) {
      socket.emit('styles', data);
    });
  });
  socket.on('put styles', function (data) {
    console.log('data to save', data);
    fs.writeFileAsync('src/style.css', data);
  });
});

http.listen(3000);

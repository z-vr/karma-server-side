var findUrlRoot = require('./findUrlRoot');
var extend = require('lowscore/extend');

var messages = {};

var messageIndex = 1;

function messageId() {
  return Date.now() + ':' + messageIndex++;
}

function getError(error) {
  var err = new Error(error.message);
  extend(err, error);
  return err;
}

var socket = io('/karma-server-side', {
  reconnectionDelay: 500,
  reconnectionDelayMax: Infinity,
  timeout: 2000,
  path: findUrlRoot() + '/socket.io',
  'sync disconnect on unload': true,
  transports: ['polling', 'websocket']
});

function listenForResult(id, socket) {
  return new Promise(function (resolve, reject) {
    function handler(response) {
      if (response.id === id && !response.acknowledge) {
        if (response.error) {
          reject(getError(response.error));
        } else {
          resolve(response.result);
        }
        socket.removeListener('server-side', handler);
      }
    }
    socket.on('server-side', handler);
  });
}

module.exports = {
  send: function (msg) {
    var id = messageId();
    msg.id = id;

    var p = listenForResult(id, socket);

    socket.emit('server-side', msg);

    return p;
  },

  sendAsync: function (message) {
    var id = messageId();
    message.id = id;

    var p = new Promise(function (resolve, reject) {
      function handler(response) {
        if (response.id === id) {
          if (response.acknowledge) {
            resolve({ promise: listenForResult(id, socket) });
          } else if (response.error) {
            reject(getError(response.error));
          }
          socket.removeListener('server-side', handler);
        }
      }
      socket.on('server-side', handler);
    });

    socket.emit('server-side', message);

    return p;
  }
};

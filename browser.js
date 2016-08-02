var parseFunction = require('parse-function');
var server = require('./reqres');

function namedArguments(names, values) {
  var args = {};

  names.forEach(function (arg, index) {
    args[arg] = values[index];
  });

  return args;
}

function run() {
  var fn = parseFunction(arguments[arguments.length - 1]);
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

  var args = namedArguments(fn.args, runArguments);

  return server.send({ script: fn.body, arguments: args });
};

function runPromise () {
  var fn = parseFunction(arguments[arguments.length - 1]);
  var runArguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

  var args = namedArguments(fn.args, runArguments);

  return server.sendAsync({ script: fn.body, arguments: args })
}

module.exports = {
  run: run,
  runPromise: runPromise,
}

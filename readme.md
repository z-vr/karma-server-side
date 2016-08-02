# Karma Server Side

Ever wanted to interact with the host system when running karma tests? This module allows the tests running in your browser to do things on the server-side, that is, in node. This means you can run API or DB setup code from your tests inside karma.

Also, when you change your server-side files, they'll be reloaded on the next test run. No need to reload karma!

## install

```sh
npm install karma-server-side
```

Edit your `karma.conf.js` to look like this, add `server-side` to the `frameworks` array:

```js
module.exports = function(config) {
  config.set({

    ...

    frameworks: [..., 'server-side'],

    ...

  });
}
```

# usage

In your tests (in the browser):

```js
var server = require('karma-server-side');

server.run(function () {
  console.log('this is run on the server');
  return 'result';
}).then(function (result) {
  // result == 'result'
});
```

`run` returns a promise which completes when the function has executed on the server.

## require

You can require modules on the server side by using `serverRequire` or `require`. Note that if you use `require` and browserify, then browserify will try to resolve those modules and bundle them into the test code in the browser.

`serverRequire` and `require` requires files relative to the current working directory of karma, not from the current test file.

## promises

If you return a promise from the function passed to `run()` then `run()` will wait for it to complete.

```js
server.run(function () {
  var fs = serverRequire('fs-promise');
  return fs.readFile('afile.txt', 'utf-8');
}).then(function (fileContents) {
  // fileContents is the contents of afile.txt
});
```


## returning a promise
If you use `runPromise` method, it will return a promise to execute your function on
the server, and it will be resolved with an object containing the promise you requested, e.g.,

```js
server.runPromise(function () {
  var fs = serverRequire('fs-promise');
  return fs.readFile('afile.txt', 'utf-8');
}).then(function (res) {
  // res: { promise: Promise{} }
  return res.promise;
}).then(function (fileContents) {
  // fileContents is the contents of afile.txt
});
```

This allows to synchronise code execution between browsers and Karma server. For example:

```js
it('should listen for requests') {
  var p = server.run(function () {
    return new Promise(function (resolve) {
      // assuming we've created some http server in context beforehand
      this.httpServer.once('request', resolve);
    });
  });
  request('http://localhost:8080/test');
  return p;
}
```
Here, we will tell an http server to resolve a promise on request, however due to the fact that
the socket.io message from the browser to the server might take a few _ms_ to be delivered, our
test would have executed the request before the promise was created. To solve this problem, we
use `runPromise` which returns a promise which gurantees that the message was delived, and it
is resolved with an object `{ promise: Promise{} }`, so that the promises are not chained.

```js
it('should listen for requests') {
 return server.runPromise(function () {
    return new Promise(function (resolve) {
      // assuming we've created some http server in context beforehand
      this.httpServer.once('request', resolve);
    });
  }).then(function (res) {
    // promise has been created on the server, can send a request now
    request('http://localhost:8080/test');
    return res.promise;
  });
}
```

## passing arguments

You can pass arguments to the function:

```js
server.run(1, 2, function (a, b) {
  return a + b;
}).then(function (result) {
  // result == 3
});
```

## run context

The `this` inside the function can be used to store values between calls to `run()`:

```js
server.run(function () {
  this.x = 'something';
}).then(function () {
  server.run(function () {
    return this.x;
  }).then(function (result) {
    // result == 'something'
  });
});
```

# Debug

`karma-server-side` uses [debug](https://github.com/visionmedia/debug) so you can see debug information by running karma with a `DEBUG=karma-server-side` variable:

```sh
DEBUG=karma-server-side karma start
```

'use strict';

var assert = require('assert')
var from = require('from2')

var merge = require('./')

function test (name, fn, c) {
  var combined = c || merge();
  var to = after(1000, process.emit.bind(process), 'error', new Error('Timed out: ' + name))
  combined.on('end', function () {
    clearTimeout(to)
  });
  fn(combined);
}

test('smoke', function (combined) {

  function addSource (i) {
    if (i === 38) return;
    combined.add(range(i))
    after(6, addSource, i + 1)
  }

  var total = 0

  combined.on('data', function (i) { total += i })
  combined.on('end', function () { assert.equal(666, total) })

  addSource(-36)
})

test('pause/resume', function (combined) {
  combined.add(range(100))
  combined.add(range(-100))
  var counter = 0;
  combined.on('data', function () { counter++ })

  after(20, function () {
    combined.pause()
    assert(counter < 200)
    var pauseCount = counter;

    after(50, function () {
      assert.equal(pauseCount, counter);
      combined.resume();
    });

  });

  combined.on('end', function () { assert.equal(counter, 200) })
})

test('array', function (combined) {
  var counter = 0;
  combined.on('data', function () { counter++ })
  combined.on('end', function () { assert.equal(counter, 200) })
}, merge([
  range(100),
  range(-100)
]))

test('isEmpty', function (combined) {
  assert(combined.isEmpty());
  combined.on('data', function (n) { assert.equal(0, n) });
  combined.add(range(1));
  assert(!combined.isEmpty());
})

test('propagates errors', function (combined) {
  var ERROR_MESSAGE = 'TEST: INTERNAL STREAM ERROR';
  var streamToError = range(100);
  var streamJustFine = range(-100);
  var errorCounter = 0;

  combined.add(streamToError);
  combined.add(streamJustFine);
  combined.on('error', function(err) {
    assert.equal(err.message, ERROR_MESSAGE);
    errorCounter++;
  })

  after(50, function () {
    assert.equal(errorCounter, 0);
    streamToError.emit('error', new Error(ERROR_MESSAGE));

    after(1, function () {
      assert.equal(errorCounter, 1);
      // End the stream manually to end the test
      combined.emit('end');
    });

  });
})

function range (n) {
  var k = n > 0 ? -1 : 1
  return from.obj(function (_, next) {
    setTimeout(function () {
      next(null, n === 0 ? null : n += k)
    }, Math.round(6 + Math.round(Math.random() * 6)));
  })
}

function after (ms, fn, a, b, c) { return setTimeout(fn, ms, a, b, c) }

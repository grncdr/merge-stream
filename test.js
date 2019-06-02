// merge-stream

const assert = require('assert')
const from = require('from2')

const merge = require('./')

const range = (n) => {
  const k = n > 0 ? -1 : 1
  return from.obj((_, next) => {
    setTimeout(() => {
      next(null, n === 0 ? null : n += k)
    }, Math.round(6 + Math.round(Math.random() * 6)));
  })
}

const after = (ms, fn, a, b, c) => setTimeout(fn, ms, a, b, c)

const test = (name, fn, c) => {
  let combined = c || merge();
  const to = after(1500, process.emit.bind(process), 'error', new Error('Timed out: ' + name))
  combined.on('end', () => {
    clearTimeout(to)
  });
  fn(combined);
}

test('smoke', (combined) => {

  const addSource = (i) => {
    if (i === 38) return;
    combined.add(range(i))
    after(6, addSource, i + 1)
  }

  let total = 0

  combined.on('data', (i) => total += i)
  combined.on('end', () => assert.equal(666, total))

  addSource(-36)
})

test('pause/resume', (combined) => {
  combined.add(range(100))
  combined.add(range(-100))
  let counter = 0;
  combined.on('data', () => counter++)

  after(20, () => {
    combined.pause()
    assert(counter < 200)
    const pauseCount = counter;

    after(50, () => {
      assert.equal(pauseCount, counter);
      combined.resume();
    });

  });

  combined.on('end', () => assert.equal(counter, 200))
})

test('array', (combined) => {
  let counter = 0;
  combined.on('data', () => counter++)
  combined.on('end', () => assert.equal(counter, 200))
}, merge([
  range(100),
  range(-100)
]))

test('isEmpty', (combined) => {
  assert(combined.isEmpty());
  combined.on('data', (n) => assert.equal(0, n));
  combined.add(range(1));
  assert(!combined.isEmpty());
})

test('propagates errors', (combined) => {
  const ERROR_MESSAGE = 'TEST: INTERNAL STREAM ERROR';
  const streamToError = range(100);
  const streamJustFine = range(-100);
  let errorCounter = 0;

  combined.add(streamToError);
  combined.add(streamJustFine);
  combined.on('error', (err) => {
    assert.equal(err.message, ERROR_MESSAGE);
    errorCounter++;
  })

  after(50, () => {
    assert.equal(errorCounter, 0);
    streamToError.emit('error', new Error(ERROR_MESSAGE));

    after(1, () => {
      assert.equal(errorCounter, 1);
      // End the stream manually to end the test
      combined.emit('end');
    });

  });
})

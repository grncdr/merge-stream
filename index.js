var Stream = require('stream');

module.exports = function (/*streams...*/) {
  var sources = [];
  var stream  = new Stream();

  stream.writable = stream.readable = true;

  [].slice.call(arguments).forEach(addStream);

  stream.add = addStream;

  stream.write = function (data) {
    this.emit('data', data)
  }

  stream.destroy = function () {
    sources.forEach(function (e) {
      if (e.destroy) e.destroy()
    })
  }

  return stream

  function addStream(e) {
    sources.push(e);
    e.pipe(stream, {end: false})
    var ended = false
    e.on('end', function () {
      if (ended) return
      ended = true
      sources = sources.filter(function (it) { return it !== e })
      if (!sources.length) stream.emit('end')
    })
    return e;
  }
}

'use strict'

var through = require('through2')

module.exports = function (/*streams...*/) {
  var firstTick = true;
  var sources = []
  var output  = through.obj()
  var args = arguments

  if (args[0] instanceof Array){
    args = args[0]
  }

  output.setMaxListeners(0)

  output.add = add

  output.on('unpipe', remove)

  Array.prototype.slice.call(args).forEach(add)

  return output

  function add (source) {
    sources.push(source)
    source.once('end', remove.bind(null, source))
    source.pipe(output, {end: false})
    return source
  }

  function remove (source) {
    sources = sources.filter(function (it) { return it !== source })
    if (!sources.length && output.readable) { output.emit('end') }
  }
}

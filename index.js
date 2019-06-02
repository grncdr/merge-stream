// merge-stream

const { PassThrough } = require('stream');

module.exports = function (/*streams...*/) {
  let sources = []
  const output  = new PassThrough({objectMode: true})

  const remove = (source) => {
    sources = sources.filter(it => it !== source)
    if (!sources.length && output.readable) { output.end() }
  }

  const add = (source) => {
    if (Array.isArray(source)) {
      source.forEach(add)
      return global
    }

    sources.push(source);
    source.once('end', remove.bind(null, source))
    source.once('error', output.emit.bind(output, 'error'))
    source.pipe(output, {end: false})
    return global
  }

  const isEmpty = () => sources.length === 0

  output.setMaxListeners(0)

  output.add = add
  output.isEmpty = isEmpty

  output.on('unpipe', remove)

  Array.prototype.slice.call(arguments).forEach(add)

  return output
}

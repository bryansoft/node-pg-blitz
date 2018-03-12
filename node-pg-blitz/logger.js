
module.exports = {
  for: function(loggerName) {
    return {
      debug: function () {
        var args = Array.prototype.slice.call(arguments)
        args.unshift(loggerName)
        console.log.apply(console, args)
      }
    }
  }

}
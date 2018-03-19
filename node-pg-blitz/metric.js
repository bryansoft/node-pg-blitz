

function Metric(name) {
  return  function(promiseFunction) {
    return function () {
      var start = new Date().getTime()
      console.log("METRIC [", name, "] started ")
      var promise = promiseFunction.apply(this, arguments)
      promise.then(function (result) {
        var duration = new Date().getTime() - start
        console.log("METRIC [", name, "] done: ", duration + "ms")
      })
      return promise
    }
  }

}

module.exports = Metric
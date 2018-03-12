var fs = require('fs')

var loadPromise = null
module.exports = function () {
  console.log("inside this!")
  if (!loadPromise) {
    loadPromise = new Promise(function(resolve, reject) {
      fs.readFile(__dirname + '/clone-schema-function.sql', function(err, data) {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
  return loadPromise
}
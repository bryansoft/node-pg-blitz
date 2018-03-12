
const Dataset = require('./Dataset')

var PgBlitz = function (config) {
  this._config = config
}



PgBlitz.prototype.newDataset = function (loaderFunction) {
  return new Dataset({
    connectionProvider: this._config.connectionProvider,
    loader: loaderFunction
  })
}
module.exports = PgBlitz
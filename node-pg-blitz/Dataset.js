const makeid = require('./makeid')
const cloneSchemaFunctionLoader = require("./clone-schema-function-loader")
const metric = require('./metric')
const pgInterceptor = require('./pg-interceptor')
const logger = require('./logger').for('Dataset')
const Client = require('pg').Client

const metrics = {
  dataSchema: {
    drop: metric('dataSchema.drop'),
    create: metric('dataSchema.create'),
    load: metric('dataSchema.load'),
    switch: metric('dataSchema.switch'),
    cloneFunc: metric('dataSchema.cloneFunc')
  },
  instance: {
    drop: metric('instance.drop'),
    copy: metric('instance.copy'),
    switch: metric('instance.switch')
  }
}


function Dataset(config) {
  this._config = config
  this._id = makeid()
}

Dataset.prototype.use = function(operation) {
  var createNamespace = require('continuation-local-storage').createNamespace;
  var getNamespace = require('continuation-local-storage').getNamespace;
  var sessionId = makeid()
  var self = this
  var sessionSchemaName = this._id + "_" + sessionId

  return this._config.connectionProvider()
    .then(function(connection) {
      return self._initialize(connection)
        .then(newDropSchemaTask(connection, sessionSchemaName))
        .then(newSchemaCloneTask(connection, self._datasetSchemaName(), sessionSchemaName))
        .then(function () {
          pgInterceptor.subscribe(function (connection, queryMethod) {
            var session = getNamespace("node-pg-blitz")
            if (sessionId === session.get('sessionId')) {
              logger.debug("Setting up schema for query: ", session.get('sessionId'))
              return queryMethod.apply(connection, ["set search_path to " + sessionSchemaName])
            }
          });
          logger.debug(connection.query === pgInterceptor.interceptor)
          var session = createNamespace("node-pg-blitz");
          return session.runAndReturn(function () {
            session.set('sessionId', sessionId)
            return operation()
          })
        })
        .then(function(){
          connection.release()
        }, function(e){
          connection.release()
          console.error(e)
          throw e
        })
    })
}

Dataset.prototype._initialize = function (client) {
  var self = this
  if (this._initializePromise) {
    return self._initializePromise
  }
  this._initializePromise = metrics.dataSchema.drop(function () {
    return client.query("drop schema if exists " + self._datasetSchemaName()() + " cascade")
  })().then(metrics.dataSchema.create(function () {
      return client.query("create schema " + self._datasetSchemaName()())
    }))

    .then(metrics.dataSchema.switch(function () {
      return client.query("set search_path to " + self._datasetSchemaName()())
    }))

    .then(metrics.dataSchema.load(function () {
      return self._load(client)
    }))

    .then(cloneSchemaFunctionLoader)

    .then(metrics.dataSchema.cloneFunc(function (cloneSchemaScript) {
      var query = client.query(cloneSchemaScript.toString());
      console.log("started clone", cloneSchemaScript)
      query.then(function() {
        console.log('done')
      })

      return query
    }))
  return this._initializePromise
}

Dataset.prototype._load = function (pgClient) {
  return this._config.loader(pgClient)
}

Dataset.prototype._datasetSchemaName = function () {
  return this._id
}

function newSchemaCloneTask(connection, datasetSchemaName, sessionSchemaName) {
  return metrics.instance.copy(function () {
    return connection.query("select " + datasetSchemaName + ".clone_schema('" + datasetSchemaName + "', '" + sessionSchemaName + "')")
  })
}

function newDropSchemaTask(connection, sessionSchemaName) {
  return metrics.instance.drop(function () {
    return connection.query("drop schema if exists " + sessionSchemaName + " cascade")
  })
}

module.exports = Dataset
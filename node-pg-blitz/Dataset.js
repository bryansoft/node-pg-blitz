const makeid = require('./makeid')
const cloneSchemaFunctionLoader = require("./clone-schema-function-loader")
const metric = require('./metric')
const pgInterceptor = require('./pg-interceptor')
const logger = require('./logger').for('Dataset')
const createNamespace = require('continuation-local-storage').createNamespace;
const getNamespace = require('continuation-local-storage').getNamespace;
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
    switch: metric('instance.switch'),
    operate: metric('instance.operate')
  }
}


function Dataset(config) {
  this._config = config
  this._id = makeid().toLowerCase()
}

Dataset.prototype.use = function(operation) {
  var sessionId = makeid().toLowerCase()
  var self = this
  var sessionSchemaName = this._id + "_" + sessionId

  logger.debug("Creating session: ", sessionSchemaName, " using dataset schema: ", self._datasetSchemaName())
  return this._config.connectionProvider()
    .then(function(connection) {
      return self._initialize(connection)
        .then(newDropSchemaTask(connection, sessionSchemaName))
        .then(newSchemaCloneTask(connection, self._datasetSchemaName(), sessionSchemaName))
        .then(newLoadDatasetTask(sessionId, sessionSchemaName, operation))
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
    return client.query("drop schema if exists " + self._datasetSchemaName() + " cascade")
  })().then(metrics.dataSchema.create(function () {
      return client.query("create schema " + self._datasetSchemaName())
    }))

    .then(metrics.dataSchema.switch(function () {
      return client.query("set search_path to " + self._datasetSchemaName())
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
  // var self = this
  // var loadId = makeid().toLowerCase()
  // var subscription = pgInterceptor.subscribe(function (connection, queryMethod) {
  //   var session = getNamespace("node-pg-blitz")
  //   if (loadId === session.get('loadId')) {
  //     // logger.debug("Setting up schema for loading query: ", self._datasetSchemaName())
  //     return queryMethod.apply(connection, ["set search_path to " + self._datasetSchemaName()])
  //   }
  // });
  // var session = createNamespace("node-pg-blitz");
  // return session.runAndReturn(function () {
  //   session.set('loadId', loadId)
  //   return3
  // }).then(subscription.unsubscribe)
}

Dataset.prototype._datasetSchemaName = function () {
  return this._id
}

function newSchemaCloneTask(connection, datasetSchemaName, sessionSchemaName) {
  return metrics.instance.copy(function () {
    logger.debug("Copying from dataset schema: ", datasetSchemaName, " instance schema: ", sessionSchemaName)
    return connection.query("select " + datasetSchemaName + ".clone_schema('" + datasetSchemaName + "', '" + sessionSchemaName + "')")
  })
}

function newDropSchemaTask(connection, sessionSchemaName) {
  return metrics.instance.drop(function () {
    return connection.query("drop schema if exists " + sessionSchemaName + " cascade")
  })
}

function newLoadDatasetTask(sessionId, sessionSchemaName, operation) {
  return metrics.instance.operate(function () {
    var subscription = pgInterceptor.subscribe(function (connection, queryMethod) {
      var session = getNamespace("node-pg-blitz")
      if (sessionId === session.get('sessionId')) {
        logger.debug("Setting up schema for query: ", sessionSchemaName)
        return queryMethod.apply(connection, ["set search_path to " + sessionSchemaName])
      }
    });
    var session = createNamespace("node-pg-blitz");
    return session.runAndReturn(function () {
      session.set('sessionId', sessionId)
      return operation()
    }).then(subscription.unsubscribe)
  })
}

module.exports = Dataset
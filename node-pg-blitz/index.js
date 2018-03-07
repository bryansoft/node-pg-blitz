
function PgBlitzMetrics() {
  this.metrics = {}
}

PgBlitzMetrics.prototype.start = function (metricName) {
  var metrics = this.metrics
  return function (r) {
    if (!PgBlitz._useMetrics){
      return r
    }
    console.log("Start metric: ", metricName)
    metrics[metricName] = new Date().getTime()
    return Promise.resolve(r)
  }
}

PgBlitzMetrics.prototype.end = function (metricName) {
  var metrics = this.metrics
  return function (r) {
    if (!PgBlitz._useMetrics){
      return r
    }
    var start = metrics[metricName]
    delete metrics[metricName]
    console.log("METRIC: " + metricName + " => " + (new Date().getTime() - start))
    return Promise.resolve(r);
  }
}

PgBlitzMetrics.prototype.of = function (funcPromise, metricName) {
  var self = this
  if (!PgBlitz._useMetrics){
    return funcPromise
  }
  return function (r) {
    return self.start(metricName)(r).then(funcPromise).then(self.end(metricName))
  }
}

function DatasetSchema(datasetName, loaderFunction){
  this._loaderFunction = loaderFunction
  this._datasetName = 'pgblitz_dataset_' + datasetName
}

DatasetSchema.prototype._initialize = function (client){
  if (this._initializePromise) {
    return this._initializePromise
  }
  var metrics = new PgBlitzMetrics()
  var loaderFunction = this._loaderFunction
  var datasetName = this._datasetName
  this._initializePromise = new Promise(function (resolve, reject) {
    return metrics.of(function () {
      return client.query("drop schema if exists " + datasetName + " cascade")
    }, "DROP_DATA_SCHEMA_METRIC")()

      .then(metrics.of(function () {
        return client.query("create schema " + datasetName)
      }, "CREATE_DATA_SCHEMA_METRIC"))

      .then(metrics.of(function () {
        return client.query("set search_path to " + datasetName)
      }, "SEARCH_PATH_DATA_SCHEMA_METRIC"))

      .then(metrics.of(function () {
        return loaderFunction(client)
      }, "LOADER_DATA_SCHEMA_METRIC"))

      .then(metrics.of(function () {
        return client.query(CLONE_SCHEMA_FUNCTION)
      }, "CLONE_SCHEMA_FUNCTION_METRIC"))

      .then(resolve, reject)
  })
  return this._initializePromise
}

DatasetSchema.prototype.getInstance = function (pgClient) {
  var metrics = new PgBlitzMetrics()
  var datasetName = this._datasetName
  pgClient.__pgBlitzDataset = datasetName + '_instance_' + makeid()
  return this._initialize(pgClient).then(metrics.of(function () {
    return pgClient.query("drop schema if exists " + pgClient.__pgBlitzDataset + " cascade")
  }, "LOADING_DROP_SCHEMA_METRIC"))
    .then(metrics.of(function () {
      return pgClient.query("select " + datasetName + ".clone_schema('" + datasetName + "', '" + pgClient.__pgBlitzDataset + "')")
    }, "LOADING_CLONE_DATA_METRIC"))

    .then(metrics.of(function () {
      return pgClient.query("set search_path to " + pgClient.__pgBlitzDataset)
    }, "LOADING_SET_SEARCH_PATH_METRIC"))

    .then(function () {
      return pgClient
    })
}

var PgBlitz = function () {
  this._loadedDatasets = {}
}

PgBlitz._useMetrics = false

PgBlitz.prototype.registerDataset = function (datasetName, loaderFunction) {
  this._loadedDatasets[datasetName] = new DatasetSchema(datasetName, loaderFunction);
}


PgBlitz.prototype.getDatasetInstance = function (datasetName, pgClient) {
  if (!this._loadedDatasets[datasetName]) {
    throw new Error("Dataset: " + datasetName + " not registered. Register a dataset first")
  }
  return this._loadedDatasets[datasetName].getInstance(pgClient)
}




function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


module.exports = PgBlitz


const CLONE_SCHEMA_FUNCTION = "CREATE OR REPLACE FUNCTION clone_schema(source_schema text, dest_schema text) RETURNS void AS\n" +
  "$$\n" +
  "\n" +
  "DECLARE\n" +
  "object text;\n" +
  "buffer text;\n" +
  "default_ text;\n" +
  "column_ text;\n" +
  "BEGIN\n" +
  "EXECUTE 'CREATE SCHEMA ' || dest_schema ;\n" +
  "\n" +
  "-- TODO: Find a way to make this sequence's owner is the correct table.\n" +
  "FOR object IN\n" +
  "SELECT sequence_name::text FROM information_schema.SEQUENCES WHERE sequence_schema = source_schema\n" +
  "LOOP\n" +
  "EXECUTE 'CREATE SEQUENCE ' || dest_schema || '.' || object;\n" +
  "END LOOP;\n" +
  "\n" +
  "FOR object IN\n" +
  "SELECT TABLE_NAME::text FROM information_schema.TABLES WHERE table_schema = source_schema\n" +
  "LOOP\n" +
  "buffer := dest_schema || '.' || object;\n" +
  "EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || source_schema || '.' || object || ' INCLUDING CONSTRAINTS INCLUDING INDEXES INCLUDING DEFAULTS)';\n" +
  "\n" +
  "FOR column_, default_ IN\n" +
  "SELECT column_name::text, REPLACE(column_default::text, source_schema, dest_schema) FROM information_schema.COLUMNS WHERE table_schema = dest_schema AND TABLE_NAME = object AND column_default LIKE 'nextval(%' || source_schema || '%::regclass)'\n" +
  "LOOP\n" +
  "EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;\n" +
  "END LOOP;\n" +
  "END LOOP;\n" +
  "\n" +
  "END;\n" +
  "\n" +
  "$$ LANGUAGE plpgsql VOLATILE;\n"

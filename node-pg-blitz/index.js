
function PgBlitzMetrics() {
  this.metrics = {}
}

PgBlitzMetrics.prototype.start = function (metricName) {
  var metrics = this.metrics
  return function (r) {
    metrics[metricName] = new Date().getTime()
    return Promise.resolve(r)
  }
}

PgBlitzMetrics.prototype.end = function (metricName) {
  var metrics = this.metrics
  return function (r) {
    var start = metrics[metricName]
    delete metrics[metricName]
    console.log("METRIC: " + metricName + " => " + (new Date().getTime() - start))
    return Promise.resolve(r);
  }
}

var PgBlitz = function () {
}

PgBlitz._useMetrics = false

PgBlitz.prototype.loader = function (loaderFunction) {
  this._loaderFunction = loaderFunction;
}


PgBlitz.prototype.load = function (pgClient) {
  var metrics = new PgBlitzMetrics()
  pgClient._schema = makeid()
  return this._schemaInit(pgClient)
    .then(metrics.of(function () {
      return pgClient.query("drop schema if exists " + pgClient._schema + " cascade")
    }, "LOADING_DROP_SCHEMA_METRIC"))

    .then(metrics.of(function () {
      console.log(pgClient._schema)
      return pgClient.query("select pgblitzdata.clone_schema('pgblitzdata', '" + pgClient._schema + "')")
    }, "LOADING_CLONE_DATA_METRIC"))

    .then(metrics.of(function () {
      return pgClient.query("set search_path to " + pgClient._schema)
    }, "LOADING_SET_SEARCH_PATH_METRIC"))

    .then(function () {
      return pgClient
    })
}


PgBlitzMetrics.prototype.of = function (funcPromise, metricName) {
  var metrics = this.metrics
  var self = this
  return function (r) {
    return self.start(metricName)().then(funcPromise).then(self.end(metricName))
  }
}

PgBlitz.prototype._schemaInit = function (client) {
  var loaderFunction = this._loaderFunction
  var metrics = new PgBlitzMetrics()
  if (!this._schemaInitializePromise) {
    this._schemaInitializePromise = new Promise(function (resolve, reject) {
      return metrics.of(function () {
        client.query("drop schema pgblitzdata cascade")
      }, "DROP_DATA_SCHEMA_METRIC")()

        .then(metrics.of(function () {
          return client.query("create schema pgblitzdata")
        }, "CREATE_DATA_SCHEMA_METRIC"))

        .then(metrics.of(function () {
          return client.query("set search_path to pgblitzdata")
        }, "SEARCH_PATH_DATA_SCHEMA_METRIC"))

        .then(metrics.of(function () {
          return loaderFunction(client)
        }, "LOADER_DATA_SCHEMA_METRIC"))

        .then(metrics.of(function () {
          return client.query(CLONE_SCHEMA_FUNCTION)
        }, "CLONE_SCHEMA_FUNCTION_METRIC"))

        .then(resolve, reject)
    })
  }
  return this._schemaInitializePromise
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

console.log(makeid());

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

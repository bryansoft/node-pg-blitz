

var logger = require('./logger').for("pg-interceptor");
const Client = require('pg').Client

var subscriptions = []
module.exports = {
  interceptor: interceptor,

  subscribe: function(onIntercept) {
    attach()
    subscriptions.push(onIntercept)
    logger.debug("subscription created. count: ", subscriptions.length)
    return {
      unsubscribe: function () {
        var index = subscriptions.indexOf(onIntercept);
        if (index !== -1) subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          logger.debug("subscription unsubscribed. count: ", subscriptions.length)
          detach()
        }
      }
    }
  }
}

var pgQuery = null
function attach() {
  const Client = require('pg').Client
  pgQuery = pgQuery || Client.prototype.query

  if (Client.prototype.query !== interceptor) {
    // logger.debug('attaching to pg client query')
  }
  Client.prototype.query = interceptor
}

function detach() {
  if (Client.prototype.query !== interceptor) {
    // logger.debug('detaching from pg client query')
  }
  Client.prototype.query = pgQuery || Client.prototype.query
}

function interceptor() {
  var args = arguments
  // logger.debug("Intercepting query: ", args)
  var client = this
  function originalQuery() {
    return pgQuery.apply(client, args)
  }
  // logger.debug("executing query: ", arguments)
  return onIntercept(client)
    .then(originalQuery)
}


function onIntercept(client) {
  for(var i = 0; i < subscriptions.length; i++) {
    var promise = subscriptions[i](client, pgQuery)
    if (promise) {
      return promise
    }
  }
  // logger.debug("No interception on postgres query")
  return Promise.resolve()
}
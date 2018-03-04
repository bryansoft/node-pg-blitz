

module.exports = function (context) {
  return {
    newDb: function() {
      context.createConnectionProvider()
    },
    destroy: function () {

    }
  }
}
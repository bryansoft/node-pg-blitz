

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: "test",
  database: 'testdb',
  port: 5432
})

const PgBlitz = require('../../node-pg-blitz')
const blitz = new PgBlitz()
const jsDataLoader = require('../js-data-loader')

blitz.registerDataset("default", jsDataLoader)


describe("Just some sanity tests", function() {

  it("should work", function(){
    var firstStart = new Date().getTime()
    return pool.connect()
      .then(function(client){
        return blitz.getDatasetInstance("default", client)
      })
      .then(function (client) {
        var start = new Date().getTime()
        return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
          [101, "My City", "CIT", "DISTRICT 111", 1122334])
          .then(function (r) {
            return client.query("select count(*) from city where id = 101")
              .then(function (r) {
                console.log("Query successful")
                var testTime = new Date().getTime() - start
                var totalTime = new Date().getTime() - firstStart
                console.log(r.rows[0].count)
                console.log("Performance: ")
                // console.log("\tLoad:   " + (loadTime))
                console.log("\tTest:   " + (testTime))
                console.log("\tTotal:  " + (totalTime))
                // City.findAll()
              })
          }).then(function () {
            client.release(true)
          })
      }, function(err){
        console.log("ERROR", err)
      })
  });

  for (var i = 0; i < 100; i++) {

    it("record performance i:" + i, function () {
      var firstStart = new Date().getTime()
      return pool.connect()
        .then(function (client) {
          return blitz.getDatasetInstance("default", client)
        })
        .then(function (client) {
          console.log("in here?")
          var start = new Date().getTime()
          return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
            [101, "My City", "CIT", "DISTRICT 111", 1122334])
            .then(function (r) {
              return client.query("select count(*) from city where id = 101")
                .then(function (r) {
                  console.log("Query successful")
                  var testTime = new Date().getTime() - start
                  var totalTime = new Date().getTime() - firstStart
                  console.log(r.rows[0].count)
                  console.log("Performance: ")
                  // console.log("\tLoad:   " + (loadTime))
                  console.log("\tTest:   " + (testTime))
                  console.log("\tTotal:  " + (totalTime))
                  // City.findAll()
                })
            }).then(function () {
              client.release(true)
            })
        })
    })
  }



  describe("Hex to RGB conversion", function() {
  });
});
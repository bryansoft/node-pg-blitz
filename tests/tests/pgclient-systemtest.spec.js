

const expect = require('chai').expect
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: "test",
  database: 'testdb',
  port: 5432
})

const PgBlitz = require('node-pg-blitz')

const jsDataLoader = require('../cities-data-loader')
var blitz = new PgBlitz({
  connectionProvider: function(){
    return pool.connect()
  }
})

var datasets = {
  cities: blitz.newDataset(jsDataLoader)
}



describe("Just some sanity tests", function() {

  it("should work", function(){
    return datasets.cities.use(function () {
      console.log("Starting tests!")
      var firstStart = new Date().getTime()
      return pool.connect()
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
        }, function (err) {
          console.log("ERROR", err)
        })
    })
  });

  it("performance check of loading without node-pg-blitz", function(){
    var firstStart
    return pool.connect()
      .then(function (c){
        firstStart = new Date().getTime()
        return c.query("drop schema if exists standard_perf_check cascade")
          .then(function () {
            return c.query("create schema standard_perf_check")
          })
          .then(function () {
            return c.query("set search_path to standard_perf_check")
          })
          .then(function () {
            return require('../cities-data-loader')(c)
          })
          .then(function () {
            console.log("Standard load performance", new Date().getTime() - firstStart)
          })
          .then(function(){
            c.release()
          }, function (e) {
            c.release()
            throw e
          })
      })
  });

  // for (var i = 0; i < 10; i++) {
  //
  //   it("record performance i:" + i, function () {
  //     var firstStart = new Date().getTime()
  //
  //     return datasets.cities.use(function () {
  //       return pool.connect()
  //         .then(function (client) {
  //           console.log(client.query)
  //           var start = new Date().getTime()
  //           return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
  //             [101, "My City", "CIT", "DISTRICT 111", 1122334])
  //             .then(function (r) {
  //               return client.query("select count(*) from city")
  //                 .then(function (r) {
  //                   var testTime = new Date().getTime() - start
  //                   var totalTime = new Date().getTime() - firstStart
  //                   // console.log(r.rows[0].count)
  //                   // console.log("Performance: ")
  //                   // // console.log("\tLoad:   " + (loadTime))
  //                   // console.log("\tTest:   " + (testTime))
  //                   // console.log("\tTotal:  " + (totalTime))
  //                   expect(r.rows[0].count).to.equal(1)
  //                   // City.findAll()
  //                 })
  //             }).then(function () {
  //               client.release(true)
  //             })
  //         })
  //     })
  //   })
  // }



  describe("Hex to RGB conversion", function() {
  });
});
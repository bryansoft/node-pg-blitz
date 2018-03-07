const Pool = require('pg').Pool
const PgBlitz = require('../../node-pg-blitz')
const expect = require('chai').expect

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  password: "test",
  database: 'testdb',
  port: 5432
})

const blitz = new PgBlitz()

blitz.registerDataset("pgClient", function(pgClient) {
 pgClient.query("CREATE TABLE if not exists city (" +
    "  id integer NOT NULL," +
    "  name text NOT NULL," +
    "  countrycode character(3) NOT NULL," +
    "  district text NOT NULL," +
    "  population integer NOT NULL" +
    ")")
   .then(function () {
     return pgClient.query(
       'INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)'
       [1, "Kabul", "AFG", "Kabol", 1780000])
   })
})


describe("Demonstrating how pgClient works", function () {

  it("should work", function () {
    return pool.connect()
      .then(function (client) {
        // Debating... should this framework attach to a client or generate one for you?
        return blitz.getDatasetInstance("pgClient", client)
      })
      .then(function (client) {
        return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
          [101, "My City", "CIT", "DISTRICT 111", 1122334])
          .then(function (r) {
            return client.query("select count(*) from city")
          })
          .then(function (r) {
            expect(r.rows[0].count).to.equal(2)
          })
          .then(function () {
            client.release(true)
          })
      })
  })
});
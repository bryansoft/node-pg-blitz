

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

blitz.loader(function(pgClient){
  return pgClient.query(citySchema)
    .then(function () {
      var promises = []
      for (var i = 0; i < cities.length; i++) {
        promises.push(pgClient.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)', cities[i]))
      }
      return Promise.all(promises).then(function () {
        return true;
      })
    })
})


var citySchema =
  "CREATE TABLE if not exists city (" +
  "  id integer NOT NULL," +
  "  name text NOT NULL," +
  "  countrycode character(3) NOT NULL," +
  "  district text NOT NULL," +
  "  population integer NOT NULL" +
  ");"
var countrySchema =
  "CREATE TABLE country (" +
  "  code character(3) NOT NULL," +
  "  name text NOT NULL," +
  "  continent text NOT NULL," +
  "  region text NOT NULL," +
  "  surfacearea real NOT NULL," +
  "  indepyear smallint," +
  "  population integer NOT NULL," +
  "  lifeexpectancy real," +
  "  gnp numeric(10,2)," +
  "  gnpold numeric(10,2)," +
  "  localname text NOT NULL," +
  "  governmentform text NOT NULL," +
  "  headofstate text," +
  "  capital integer," +
  "  code2 character(2) NOT NULL," +
  "  CONSTRAINT country_continent_check CHECK ((((((((continent = 'Asia'::text) OR (continent = 'Europe'::text)) OR (continent = 'North America'::text)) OR (continent = 'Africa'::text)) OR (continent = 'Oceania'::text)) OR (continent = 'Antarctica'::text)) OR (continent = 'South America'::text)))" +
  ");"
var languageSchema =
  "CREATE TABLE countrylanguage (" +
  "  countrycode character(3) NOT NULL," +
  "  \"language\" text NOT NULL," +
  "  isofficial boolean NOT NULL," +
  "  percentage real NOT NULL" +
  ");";

console.log("querying?")
// var start = new Date().getTime()
// pool.connect(function (err) {
//   if (err) {
//     return console.error(err)
//   }
//
//   console.log("connected")
//   session.bind(function () {
//     session.set("schema", "test1")
//     executeTest()
//   })()
//   session.bind(function () {
//     session.set("schema", "test2")
//     executeTest()
//   })();
//   session.bind(function () {
//     session.set("schema", "test3")
//     executeTest()
//   })();
//   session.bind(function () {
//     session.set("schema", "test4")
//     executeTest()
//   })();
//   session.bind(function () {
//     session.set("schema", "test5")
//     executeTest()
//   })();
//   session.bind(function () {
//     session.set("schema", "test6")
//     executeTest()
//   })();
//   session.bind(function () {
//     session.set("schema", "test7")
//     executeTest()
//   })();
// })

var cities = [
  [1, "Kabul", "AFG", "Kabol", 1780000],
  [2, "Qandahar", "AFG", "Qandahar", 237500],
  [3, "Herat", "AFG", "Herat", 186800],
  [4, "Mazar-e-Sharif", "AFG", "Balkh", 127800],
  [5, "Amsterdam", "NLD", "Noord-Holland", 731200],
  [6, "Rotterdam", "NLD", "Zuid-Holland", 593321],
  [7, "Haag", "NLD", "Zuid-Holland", 440900],
  [8, "Utrecht", "NLD", "Utrecht", 234323],
  [9, "Eindhoven", "NLD", "Noord-Brabant", 201843],
  [10, "Tilburg", "NLD", "Noord-Brabant", 193238],
  [11, "Groningen", "NLD", "Groningen", 172701],
  [12, "Breda", "NLD", "Noord-Brabant", 160398],
  [13, "Apeldoorn", "NLD", "Gelderland", 153491],
  [14, "Nijmegen", "NLD", "Gelderland", 152463],
  [15, "Enschede", "NLD", "Overijssel", 149544],
  [16, "Haarlem", "NLD", "Noord-Holland", 148772],
  [17, "Almere", "NLD", "Flevoland", 142465],
  [18, "Arnhem", "NLD", "Gelderland", 138020],
  [19, "Zaanstad", "NLD", "Noord-Holland", 135621],
  [20, "´s-Hertogenbosch", "NLD", "Noord-Brabant", 129170],
  [21, "Amersfoort", "NLD", "Utrecht", 126270],
  [22, "Maastricht", "NLD", "Limburg", 122087],
  [23, "Dordrecht", "NLD", "Zuid-Holland", 119811],
  [24, "Leiden", "NLD", "Zuid-Holland", 117196],
  [25, "Haarlemmermeer", "NLD", "Noord-Holland", 110722],
  [26, "Zoetermeer", "NLD", "Zuid-Holland", 110214],
  [27, "Emmen", "NLD", "Drenthe", 105853],
  [28, "Zwolle", "NLD", "Overijssel", 105819],
  [29, "Ede", "NLD", "Gelderland", 101574],
  [30, "Delft", "NLD", "Zuid-Holland", 95268],
  [31, "Heerlen", "NLD", "Limburg", 95052],
  [32, "Alkmaar", "NLD", "Noord-Holland", 92713],
  [33, "Willemstad", "ANT", "Curaçao", 2345],
  [34, "Tirana", "ALB", "Tirana", 270000],
  [35, "Alger", "DZA", "Alger", 2168000],
  [36, "Oran", "DZA", "Oran", 609823],
  [37, "Constantine", "DZA", "Constantine", 443727],
  [38, "Annaba", "DZA", "Annaba", 222518],
  [39, "Batna", "DZA", "Batna", 183377],
  [40, "Sétif", "DZA", "Sétif", 179055],
  [41, "Sidi Bel Abbès", "DZA", "Sidi Bel Abbès", 153106],
  [42, "Skikda", "DZA", "Skikda", 128747],
  [43, "Biskra", "DZA", "Biskra", 128281],
  [44, "Blida (el-Boulaida)", "DZA", "Blida", 127284],
  [45, "Béjaïa", "DZA", "Béjaïa", 117162],
  [46, "Mostaganem", "DZA", "Mostaganem", 115212],
  [47, "Tébessa", "DZA", "Tébessa", 112007],
  [48, "Tlemcen (Tilimsen)", "DZA", "Tlemcen", 110242],
  [49, "Béchar", "DZA", "Béchar", 107311],
  [50, "Tiaret", "DZA", "Tiaret", 100118],
  [51, "Ech-Chleff (el-Asnam)", "DZA", "Chlef", 96794],
  [52, "Ghardaïa", "DZA", "Ghardaïa", 89415],
  [53, "Tafuna", "ASM", "Tutuila", 5200],
  [54, "Fagatogo", "ASM", "Tutuila", 2323],
  [55, "Andorra la Vella", "AND", "Andorra la Vella", 21189],
  [56, "Luanda", "AGO", "Luanda", 2022000],
  [57, "Huambo", "AGO", "Huambo", 163100],
  [58, "Lobito", "AGO", "Benguela", 130000],
  [59, "Benguela", "AGO", "Benguela", 128300],
  [60, "Namibe", "AGO", "Namibe", 118200],
  [61, "South Hill", "AIA", "", 961],
  [62, "The Valley", "AIA", "", 595],
  [63, "Saint John´s", "ATG", "St John", 24000],
  [64, "Dubai", "ARE", "Dubai", 669181],
  [65, "Abu Dhabi", "ARE", "Abu Dhabi", 398695],
  [66, "Sharja", "ARE", "Sharja", 320095],
  [67, "al-Ayn", "ARE", "Abu Dhabi", 225970],
  [68, "Ajman", "ARE", "Ajman", 114395],
  [69, "Buenos Aires", "ARG", "Distrito Federal", 2982146],
  [70, "La Matanza", "ARG", "Buenos Aires", 1266461],
  [71, "Córdoba", "ARG", "Córdoba", 1157507],
  [72, "Rosario", "ARG", "Santa Fé", 907718],
  [73, "Lomas de Zamora", "ARG", "Buenos Aires", 622013],
  [74, "Quilmes", "ARG", "Buenos Aires", 559249],
  [75, "Almirante Brown", "ARG", "Buenos Aires", 538918],
  [76, "La Plata", "ARG", "Buenos Aires", 521936],
  [77, "Mar del Plata", "ARG", "Buenos Aires", 512880],
  [78, "San Miguel de Tucumán", "ARG", "Tucumán", 470809],
  [79, "Lanús", "ARG", "Buenos Aires", 469735],
  [80, "Merlo", "ARG", "Buenos Aires", 463846],
  [81, "General San Martín", "ARG", "Buenos Aires", 422542],
  [82, "Salta", "ARG", "Salta", 367550],
  [83, "Moreno", "ARG", "Buenos Aires", 356993],
  [84, "Santa Fé", "ARG", "Santa Fé", 353063],
  [85, "Avellaneda", "ARG", "Buenos Aires", 353046],
  [86, "Tres de Febrero", "ARG", "Buenos Aires", 352311],
  [87, "Morón", "ARG", "Buenos Aires", 349246],
  [88, "Florencio Varela", "ARG", "Buenos Aires", 315432],
  [89, "San Isidro", "ARG", "Buenos Aires", 306341],
  [90, "Tigre", "ARG", "Buenos Aires", 296226],
  [91, "Malvinas Argentinas", "ARG", "Buenos Aires", 290335],
  [92, "Vicente López", "ARG", "Buenos Aires", 288341],
  [93, "Berazategui", "ARG", "Buenos Aires", 276916],
  [94, "Corrientes", "ARG", "Corrientes", 258103],
  [95, "San Miguel", "ARG", "Buenos Aires", 248700],
  [96, "Bahía Blanca", "ARG", "Buenos Aires", 239810],
  [97, "Esteban Echeverría", "ARG", "Buenos Aires", 235760],
  [98, "Resistencia", "ARG", "Chaco", 229212],
  [99, "José C. Paz", "ARG", "Buenos Aires", 221754],
  [100, "Paraná", "ARG", "Entre Rios", 207041],
]

// var _schemaInitializePromise
// function schemaInit(client) {
//   if (!_schemaInitializePromise) {
//     _schemaInitializePromise = new Promise(function (resolve, reject) {
//       client.query("drop schema pgblitzdata cascade")
//         .then(function () {
//           return client.query("create schema pgblitzdata")
//         })
//         .then(function () {
//           return client.query("set search_path to pgblitzdata")
//         })
//         .then(function () {
//           return client.query(CLONE_SCHEMA_FUNCTION)
//         })
//         .then(function () {
//           return client.query(citySchema)
//         })
//         .then(function () {
//           // console.log("Delete complete")
//           var promises = []
//           for (var i = 0; i < cities.length; i++) {
//             promises.push(client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)', cities[i]))
//           }
//           return Promise.all(promises).then(function () {
//             return true;
//           })
//         })
//         .then(resolve, reject)
//     })
//   }
//   return _schemaInitializePromise
// }
//
// function load(client) {
//
//   return schemaInit(client)
//     .then(function () {
//       client.query("drop schema " + client._schema + " cascade")
//     })
//     .then(function () {
//       console.log(client._schema)
//       return client.query("select pgblitzdata.clone_schema('pgblitzdata', '" + client._schema + "')")
//     })
//     .then(function () {
//       return client.query("set search_path to " + client._schema)
//     })
//     .then(function(){
//       return client
//     })
// }




describe("Color Code Converter", function() {

  it("should work", function(){
    var firstStart = new Date().getTime()
    return pool.connect()
      .then(function(client){
        return blitz.load(client)
      })
      .then(function (client) {
        var start = new Date().getTime()
        return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
          [101, "Bryan", "AAA", "Bryan 2", 1122334])
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
  });

  [1,2,3,4,5,6,7,8].forEach(function(i) {

    it("should work " + i, function () {
      var firstStart = new Date().getTime()
      return pool.connect()
        .then(function (client) {
          return blitz.load(client)
        })
        .then(function (client) {
          var start = new Date().getTime()
          return client.query('INSERT INTO city (id, name, countrycode, district, population) VALUES ($1, $2, $3, $4, $5)',
            [101, "Bryan", "AAA", "Bryan 2", 1122334])
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
  })



  describe("Hex to RGB conversion", function() {
  });
});
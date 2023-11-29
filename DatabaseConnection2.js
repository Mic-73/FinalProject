

var mysql = require('mysql');

var con = mysql.createConnection({
 host: "localhost",
 user: "root",
 password: "deston02",
 database: "gamestore"
 });

con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM consoles", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});



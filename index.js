const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require('mysql');
const fs = require("fs");

// Database connection setup, do not save actual database info here
var con = mysql.createConnection({
  host: "--",
  user: "--",
  password: "--",
  database: "--"
});

con.connect(function(err) {
  if (err)
      throw err;
  console.log("Connected to MySQL");
});

// Function to read and serve HTML files
function readAndServe(path, res, errorMessage = "") {
  fs.readFile(path, function (err, data) {
    res.setHeader('Content-Type', 'text/html');

    // Append an error message to the HTML content
    data = data.toString().replace("</body>", `<p style="color: red;">${errorMessage}</p></body>`);

    res.end(data);
  });
}

// Import route handlers from separate files
require('./SearchMenu')(app, con, fs, readAndServe);
require('./StaffLogin')(app, con, fs, readAndServe);

// Start the server
app.listen(port, function () {
  console.log("NodeJS app listening on port " + port);
});

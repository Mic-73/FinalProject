module.exports = function (app, con, fs, readAndServe) {
  // Receive the main page get requests from the client
  app.get("/Staff_Login", function (req, res) {
    readAndServe("./Staff_Login.html", res);
  });

  // Receive post register data from the client
  app.post("/Staff_Login", function (req, res) {
    // ... (rest of your /Staff_Login route handling)
    var username = req.body.uname.trim();   // extract the strings received from the browser
    var password = req.body.pword.trim();   // extract the strings received from the browser

  // Using a parameterized query
  var sql_query = "SELECT * FROM login WHERE username = ? AND password = ?";

  console.log("Executing SQL query:", sql_query);
  con.query(sql_query, [username, password], function (err, result, fields) { // execute the SQL string
    if (err) {
      console.error("Error executing SQL query:", err);
      res.status(500).send("Internal Server Error");
      return;
    } else {
      if (result.length > 0) {
        // Valid username and password
        // Redirect to the menu page
        req.session.games = result;
          res.redirect("/menu");
      } else {
        // No matching user found
        readAndServe("./Staff_Login.html", res, "Invalid username or password");
      }
    }
  });
  });
};

module.exports = function (app, con, fs, readAndServe) {
  // Receive the main page get requests from the client
  app.get("/menu", function (req, res) {
    readAndServe("./menu.html", res);
  });

  // Receive post register data from the client
  app.post("/menu", function (req, res) {
    // ... (rest of your /menu route handling)
      var desc = req.body.desc.trim();   // extract the strings received from the browser

  console.log("Received POST request");
  console.log("Search term:", desc);
  // Using a parameterized query
  var sql_query = "select * from games where name like ?";

  console.log("Executing SQL query:", sql_query);
  con.query(sql_query, ['%' + desc + '%'], function (err, result, fields) { // execute the SQL string
    if (err) {
      console.error("Error executing SQL query:", err);
      res.status(500).send("Internal Server Error");
      return;
    } else {
      //*** start creating the html body for the browser
      var html_body = "<HTML><STYLE>body{font-family:arial}</STYLE>";
      html_body = html_body + "<BODY><TABLE BORDER=1>";

      //*** print column headings
      html_body = html_body + "<TR>";
      for (var i = 1; i < fields.length; i++)
        html_body = html_body + ("<TH>" + fields[i].name.toUpperCase() + "</TH>");
      html_body = html_body + "</TR>";

      //*** prints rows of table data
      for (var i = 0; i < result.length; i++) {
        var multiplayerValue;
        if (result[i].multiplayer === 1) {
          multiplayerValue = 'Yes';
        } else {
          multiplayerValue = 'No';
        }
        html_body = html_body + "<TR>";
        html_body = html_body + (
          "<TD>" + result[i].name + "</TD>" +
          "<TD>" + result[i].price + "</TD>" +
          "<TD>" + result[i].publisher + "</TD>" +
          "<TD>" + result[i].player_type + "</TD></TR>");
      }

      html_body = html_body + "</TABLE>";

      //** finish off the html body with a link back to the search page
      html_body = html_body + "<BR><BR><BR><a href='/menu'>Go Back To Search</a><BR><BR><BR>";
      html_body = html_body + "</BODY></HTML>";

      console.log("Result:", result);
      console.log(html_body);             // send query results to the console
      res.send(html_body);                // send query results back to the browser
    }
  });
  });
};

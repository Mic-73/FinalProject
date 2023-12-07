const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const port = 3000;
const path = require("path");
const fs = require('fs');

// Create an instance of Express
const app = express();

app.use(session({
    secret: 'random-key', // Change this to a secure random string
    resave: false,
    saveUninitialized: true
}));


// Set up middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


// Create a MySQL connection pool
const mysql = require('mysql');
const con = mysql.createConnection({
    host: "35.232.159.218",
  user: "root",
  password: "Queries42$",
  database: "game_stock"
});

// Connect to the database
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
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


//******************************************************************************
//*** this routing table handles all the GET requests from the browser
//******************************************************************************

app.get("/", function (req, res) {
    readAndServe("./Staff_Login.html", res)

});

app.get("/Staff_Login", function (req, res) {
    readAndServe("./Staff_Login.html", res);
  });

app.get("/menu", function (req, res) {
    if (req.session.user) {
        const userData = req.session.user; // Get user information from the session

        const sql_query = "SELECT i.inventory_id, g.gname, g.price, g.publisher, g.player_type FROM inventory i JOIN games g USING(game_id)";

        con.query(sql_query, function (err, result, fields) {
            if (err) {
                console.error("Error executing SQL query:", err);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Build an HTML string with the fetched data and user information
            let html = "<html><head><style>";
            html += "body { font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; margin: 50px; }";
            html += "h1 { color: #3366cc; }";
            html += "h2 { color: #000; }";
            html += "form { width: 300px; margin: 0 auto; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: left; }";
            html += "select, input[type='text'] { width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box; }";
            html += "input[type='submit'] { background-color: #3336cc; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }";
            html += "input[type='submit']:hover { background-color: #111acc; }";
            html += "table { border-collapse: collapse; width: 100%; }";
            html += "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
            html += "th { cursor: pointer; }";
            html += ".center-button { text-align: center; margin-top: 20px; }";
            html += "a { color: #fff; background-color: #3366cc; text-decoration: none; display: inline-block; padding: 10px 20px; margin: 20px; border: none}";
            html += "a:hover { background-color: #111acc; }";

            html += "</style></head><body>";

            // Display user information
            html += `<h1>Welcome, ${userData.staff_name}!</h1>`;
            html += "<h2>Inventory Menu</h2>";

            // Add the search dropdown
            html += "<form name=\"search\" action=\"/new_search\" method=\"get\" style=\"text-align: left;\">";
            html += "<br><br>Search by:";
            html += "<select name=\"criteria\">";
            html += "<option value=\"name\">Name</option>";
            html += "<option value=\"price\">Price</option>";
            html += "<option value=\"publisher\">Publisher</option>";
            html += "</select>";
            html += "<div style=\"text-align: center;\">"; // Wrap the button in a center-aligned div
            html += "<input type=\"text\" name=\"desc\" value=\"\">";
            html += "<input type=\"submit\" value=\"Search\">";
            html += "</div>";
            html += "</form>";


            // Add the Update, Add, and Delete buttons
            html += "<div class='center-button'>";
            html += "<button style='border: none;'><a href='/updateGame'>Update</a></button>";
            html += "<button style='border: none;'><a href='/addGame'>Add Game</a></button>";
            html += "<button style='border: none;'><a href='/deleteGame'>Delete</a></button>";
            html += "<button style='border: none;'><a href='/Staff_Login'>Log Out</a></button><br><br>";

            html += "</div>";

            html += "<table border='1' id='inventoryTable'>";
            html += "<tr>";

            for (var i = 0; i < fields.length; i++) {
                html += `<th onclick='sortTable(${i})'>${fields[i].name.toUpperCase()} <span id='arrow${i}'></span></th>`;
            }

            html += "</tr>";

            // Prints rows of table data
            for (var i = 0; i < result.length; i++) {
                var playerTypeValue = result[i].player_type;
                if (playerTypeValue === 1) {
                    playerTypeValue = 'Singleplayer';
                } else if (playerTypeValue === 2) {
                    playerTypeValue = 'Singleplayer, Multiplayer Co-op';
                } else if (playerTypeValue === 3) {
                    playerTypeValue = 'Singleplayer, Multiplayer Co-op, Multiplayer Cross-Platform';
                } else if (playerTypeValue === 4) {
                    playerTypeValue = 'Multiplayer Co-op';
                } else if (playerTypeValue === 5) {
                    playerTypeValue = 'Multiplayer Cross-Platform';
                } else if (playerTypeValue === 6) {
                    playerTypeValue = 'Singleplayer, Multiplayer Cross-Platform';
                } else if (playerTypeValue === 7) {
                    playerTypeValue = 'Multiplayer Co-op, Multiplayer Cross-Platform';
                }

                html += "<tr>";
                html += `<td>${result[i].inventory_id}</td>`;
                html += `<td>${result[i].gname}</td>`;
                html += `<td>${result[i].price}</td>`;
                html += `<td>${result[i].publisher}</td>`;
                html += `<td>${playerTypeValue}</td>`;
                html += "</tr>";
            }

            html += "</table>";

            html += "<script>";
            html += "function sortTable(column) {";
            html += "const table = document.getElementById('inventoryTable');";
            html += "let arrow = document.getElementById('arrow' + column);";
            html += "let rows = Array.from(table.rows).slice(1);";
            html += "let ascending = true;";
            html += "if (arrow.innerHTML === ' ↓') {";
            html += "arrow.innerHTML = ' ↑';";
            html += "ascending = false;";
            html += "} else {";
            html += "arrow.innerHTML = ' ↓';";
            html += "}";
            html += "rows.sort((a, b) => {";
            html += "let aValue = a.cells[column].innerText;";
            html += "let bValue = b.cells[column].innerText;";
            html += "if (column === 0 || column === 2) {";
            html += "aValue = parseInt(aValue);";
            html += "bValue = parseInt(bValue);";
            html += "} else {";
            html += "aValue = aValue.toLowerCase();";
            html += "bValue = bValue.toLowerCase();";
            html += "}";
            html += "if (isNaN(aValue) || isNaN(bValue)) {";
            html += "return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);";
            html += "} else {";
            html += "return ascending ? aValue - bValue : bValue - aValue;";
            html += "}";
            html += "});";
            html += "rows.forEach(row => table.appendChild(row));";
            html += "}";
            html += "</script>";

            html += "</body></html>";

            // Send the HTML string as the response
            res.send(html);
        });
    } else {
        // User is not authenticated, redirect to login or handle accordingly
        res.redirect("/Staff_Login");
    }
});

app.get("/new_search", function (req, res) {
    if (req.session.user) {
        const userData = req.session.user; // Get user information from the session

        var criteria = req.query.criteria || "name"; // Default criteria to "name" if not provided
        if (criteria === 'name') {
            criteria = "gname";
        } else if (criteria === 'Publisher') {
            criteria = "publisher";
        } else if (criteria === 'price') {
            criteria = "price";
        }
        const desc = req.query.desc || ""; // Default desc to an empty string if not provided

        // Construct the SQL query with WHERE clause for search criteria
        const sql_query = `SELECT i.inventory_id, g.gname, g.price, g.publisher, g.player_type 
                           FROM inventory i JOIN games g USING(game_id)
                           WHERE ${criteria} LIKE ?`;

        con.query(sql_query, [`%${desc}%`], function (err, result, fields) {
            if (err) {
                console.error("Error executing SQL query:", err);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Build an HTML string with the fetched data and user information
            let html = "<html><head><style>";
            html += "body { font-family: Arial, sans-serif; background-color: #f4f4f4; text-align: center; margin: 50px; }";
            html += "h1 { color: #3366cc; }";
            html += "h2 { color: #000; }";
            html += "form { width: 300px; margin: 0 auto; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: left; }";
            html += "select, input[type='text'] { width: 100%; padding: 10px; margin-bottom: 10px; box-sizing: border-box; }";
            html += "input[type='submit'] { background-color: #3336cc; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }";
            html += "input[type='submit']:hover { background-color: #111acc; }";
            html += "table { border-collapse: collapse; width: 100%; }";
            html += "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }";
            html += "th { cursor: pointer; }";
            html += ".center-button { text-align: center; margin-top: 20px; }";
            html += "a { color: #fff; background-color: #3366cc; text-decoration: none; display: inline-block; padding: 10px 20px; margin: 20px; border: none}";
            html += "a:hover { background-color: #111acc; }";
            html += "</style></head><body>";

            // Display user information
            html += `<h1>Welcome, ${userData.staff_name}!</h1>`;
            html += "<h2>Inventory Menu</h2>";

            // Add the search dropdown
            html += "<form name=\"search\" action=\"/new_search\" method=\"get\" style=\"text-align: left;\">";
            html += "<br><br>Search by:";
            html += "<select name=\"criteria\">";
            html += "<option value=\"name\">Name</option>";
            html += "<option value=\"price\">Price</option>";
            html += "<option value=\"publisher\">Publisher</option>";
            html += "</select>";
            html += "<div style=\"text-align: center;\">"; // Wrap the button in a center-aligned div
            html += "<input type=\"text\" name=\"desc\" value=\"\">";
            html += "<input type=\"submit\" value=\"Search\">";
            html += "</div>";
            html += "</form>";

            html += "<body><table border=1 id=\"inventoryTable\"><br><br>";

            // Print column headings with sorting arrows
            html += "<tr>";
            for (var i = 0; i < fields.length; i++) {
                html += `<th onclick=\"sortTable(${i})\">${fields[i].name.toUpperCase()} <span id=\"arrow${i}\"></span></th>`;
            }
            html += "</tr>";

            // Prints rows of table data
            for (var i = 0; i < result.length; i++) {
                var playerTypeValue = result[i].player_type;
                if (playerTypeValue === 1) {
                    playerTypeValue = 'Singleplayer';
                } else if (playerTypeValue === 2) {
                    playerTypeValue = 'Singleplayer, Multiplayer Co-op';
                } else if (playerTypeValue === 3) {
                    playerTypeValue = 'Singleplayer, Multiplayer Co-op, Multiplayer Cross-Platform';
                } else if (playerTypeValue === 4) {
                    playerTypeValue = 'Multiplayer Co-op';
                } else if (playerTypeValue === 5) {
                    playerTypeValue = 'Multiplayer Cross-Platform';
                } else if (playerTypeValue === 6) {
                    playerTypeValue = 'Singleplayer, Multiplayer Cross-Platform';
                } else if (playerTypeValue === 7) {
                    playerTypeValue = 'Multiplayer Co-op, Multiplayer Cross-Platform';
                }

                html += "<tr>";
                // Make the game name a link to a new page
                html += `<td>${result[i].inventory_id}</td>`;
                html += `<td>${result[i].gname}</td>`;

                html += `<td>${result[i].price}</td>`;
                html += `<td>${result[i].publisher}</td>`;
                html += `<td>${playerTypeValue}</tr></td>`;
            }

            html += "</table>";

            // Add the "Back to Main Inventory Page" link
            html += "<p><a href=\"/menu\">Back to Main Inventory Page</a></p>";

            html += "</body><script>";
            html += "function sortTable(column) {";
            html += "    const table = document.getElementById('inventoryTable');";
            html += "    let arrow = document.getElementById('arrow' + column);";
            html += "    let rows = Array.from(table.rows).slice(1);";
            html += "    let ascending = true;";
            html += "    if (arrow.innerHTML === ' ↓') {";
            html += "        arrow.innerHTML = ' ↑';";
            html += "        ascending = false;";
            html += "    } else {";
            html += "        arrow.innerHTML = ' ↓';";
            html += "    }";
            html += "    rows.sort((a, b) => {";
            html += "        let aValue = a.cells[column].innerText;";
            html += "        let bValue = b.cells[column].innerText;";

            // Convert values to numbers for the inventory_id column
            html += "        if (column === 0 || column === 2) {"; // Assuming inventory_id is the first column
            html += "            aValue = parseInt(aValue);";
            html += "            bValue = parseInt(bValue);";
            html += "        } else {";
            html += "            aValue = aValue.toLowerCase();";
            html += "            bValue = bValue.toLowerCase();";
            html += "        }";

            html += "        if (isNaN(aValue) || isNaN(bValue)) {"; // If either value is NaN, perform string comparison
            html += "            return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);";
            html += "        } else {"; // Otherwise, perform numeric comparison
            html += "            return ascending ? aValue - bValue : bValue - aValue;";
            html += "        }";
            html += "    });";

            html += "    rows.forEach(row => table.appendChild(row));";
            html += "}";
            html += "</script></html>";

            // Send the HTML string as the response
            res.send(html);
        });
    } else {
        // User is not authenticated, redirect to login or handle accordingly
        res.redirect("/Staff_Login");
    }
});


function gameDetails(id) {
    app.get("/gameDetails", function (req, res) {
        let html = "<html><script>"
        sql_query = "Select * from games where game_id = id"
        con.query(sql_query, function (err, result, fields) {
            if (err) {
                console.error("Error executing SQL query:", err);
                res.status(500).send("Internal Server Error");
                return;
            } else {
                html += `<td>${result[0].name}</td>`;
                html += `<td>${result[0].price}</td>`;
                html += `<td>${result[0].publisher}</td>`;
                html += `<td>${result[0].player_type}</td>`;
            }
        })
        html += "</script><html>";
        res.send(html);
    })
    let html = "<html><script>"
    html = ""
    sql_query = "Select * from games where game_id = id"
    con.query(sql_query, function (err, result, fields) {
        if (err) {
            console.error("Error executing SQL query:", err);
            res.status(500).send("Internal Server Error");
            return;
        } else {
            html += `<td>${result[0].name}</td>`;
            html += `<td>${result[0].price}</td>`;
            html += `<td>${result[0].publisher}</td>`;
            html += `<td>${player_type}</td>`;
        }
    })
    html += "</script><html>";
    res.send(html);
}
app.post("/Staff_Login", function (req, res) {
    // ... (rest of your /Staff_Login route handling)
    var username = req.body.uname.trim();   // extract the strings received from the browser
    var password = req.body.pword.trim();   // extract the strings received from the browser

    // Using a parameterized query
    var sql_query = "SELECT * " +
        "FROM login l " +
        "JOIN login_staff ls USING(username) " +
        "JOIN staff sta USING(staff_id) " +
        "WHERE l.username = ? AND l.password = ?";

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
                req.session.user = result[0]; // Assuming result[0] contains user data
                res.redirect("/menu");
            } else {
                // No matching user found
                readAndServe("./Staff_Login.html", res, "Invalid username or password");
            }
        }
    });
});

app.get("/addGame", function (req, res) {
    readAndServe("./addGame.html", res)
  });
app.get("/updateGame", function (req, res) {
    readAndServe("./updateGame.html", res)
});
app.get("/deleteGame", function (req, res) {
    readAndServe("./deleteGame.html", res)
});


//******************************************************************************
//*** receive POST register data from the client
//******************************************************************************


app.post("/Staff_Login", function (req, res) {
    // ... (rest of your /Staff_Login route handling)
    var username = req.body.uname.trim();   // extract the strings received from the browser
    var password = req.body.pword.trim();   // extract the strings received from the browser

  // Using a parameterized query
  var sql_query = "SELECT * " +
      "FROM login l " +
      "JOIN login_staff ls USING(username) " +
      "JOIN staff sta USING(staff_id) " +
      "WHERE l.username = ? AND l.password = ?";

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
          req.session.user = result[0]; // Assuming result[0] contains user data
          res.redirect("/menu");
      } else {
        // No matching user found
        readAndServe("./Staff_Login.html", res, "Invalid username or password");
      }
    }
  });
  });

app.post("/add", function (req, res) {
    var name = req.body.name_desc.trim(); // Remove extra spaces from the name
    var pri = req.body.price_desc || null; // Make price, publisher, player_type optional
    var publ = req.body.publisher_desc || null;
    var play_type = req.body.player_type_desc || null;
    var g_id = -1;

    // Ensure all required fields are filled
    if (!name) {
        return res.status(400).send("Name is required");
    }

    // Get the maximum game_id from the games table
    const select_max_game_id = `SELECT MAX(game_id) AS max_game_id FROM games`;

    con.query(select_max_game_id, function (err, result, fields) {
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }

        const max_game_id = result[0].max_game_id || 0;
        g_id = max_game_id + 1;

        // Check if the game already exists in the games table
        const select_game = `SELECT * FROM games WHERE gname = ?`;

        con.query(select_game, [name], function (err, result, fields) {
            if (err) {
                console.error("Error executing SQL query:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (result.length > 0) {
                // Game already exists, use existing game_id
                g_id = result[0].game_id;
                name = result[0].gname;
                pri = result[0].price;
                publ = result[0].publisher;
                play_type = result[0].player_type;
            } else {
                // Game does not exist, insert into games table
                if (play_type === 'Singleplayer') {
                    play_type = 1;
                }
                else if (play_type === 'Singleplayer, Multiplayer Co-op') {
                    play_type = 2;
                }
                else if (play_type === 'Singleplayer, Multiplayer Co-op, Multiplayer Cross-Platform') {
                    play_type = 3;
                }
                else if (play_type === 'Multiplayer Co-op') {
                    play_type = 4;
                }
                else if (play_type === 'Multiplayer Cross-Platform') {
                    play_type = 5;
                }
                else if (play_type === 'Singleplayer, Multiplayer Cross-Platform') {
                    play_type = 'Singleplayer, Multiplayer Cross-Platform';
                }
                else if (play_type === 7) {
                    play_type = 'Multiplayer Co-op, Multiplayer Cross-Platform';
                }

                const insert_game = `INSERT INTO games (gname, price, publisher, player_type) VALUES (?, ?, ?, ?)`;

                con.query(insert_game, [name, pri, publ, play_type], function (err, result, fields) {
                    if (err) {
                        console.error("Error executing SQL query:", err);
                        return res.status(500).send("Internal Server Error");
                    }
                });
            }

            // Insert into inventory table
            const insert_inventory = `INSERT INTO inventory (game_id) VALUES (?)`;

            con.query(insert_inventory, [g_id], function (err, result, fields) {
                if (err) {
                    console.error("Error executing SQL query:", err);
                    return res.status(500).send("Internal Server Error");
                }

                // Redirect to the main inventory page
                res.redirect("/menu");
            });
        });
    });
});

app.post("/update", function (req, res) {
    var invent_id = req.body.iid; // Remove extra spaces from the name

    // Get the maximum game_id from the games table
    checkID  = "Select * from inventory join games using(game_id) where inventory_id = ?"
    con.query(checkID, invent_id, function (err, result, fields) {
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (result.length === 0) {
            // No matching user found
            readAndServe("./updateGame.html", res, "Inventory ID does not exist");
        }
        else {
            const gid = result[0].game_id;
            var name = result[0].gname; // Remove extra spaces from the name
            var price = result[0].price;
            var publisher = result[0].publisher
            var player_type = result[0].player_type;
            let html2 = `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                text-align: center;
                                margin: 50px;
                            }

                            form {
                                width: 300px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #fff;
                                border: 1px solid #ddd;
                                border-radius: 5px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                text-align: left;
                            }
                            
                            h3 {
                                font-family: 'Futura', sans-serif;
                                font-size: 28px;
                            }

                            .update {
                                color: #3366cc;
                            }

                            .game {
                                color: #000; /* Blue color */
                            }

                            input[type="text"] {
                                width: 100%;
                                padding: 10px;
                                margin-bottom: 10px;
                                box-sizing: border-box;
                            }
                            
                            .update-button {
                                text-align: center; /* Center the button */
                             }

                            input[type="submit"] {
                                background-color: #3336cc;
                                color: #fff;
                                padding: 10px 20px;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                            }

                            input[type="submit"]:hover {
                                background-color: #111acc;
                            }

                            a {
                                color: #3366cc;
                                text-decoration: none;
                                display: inline-block;
                                margin-top: 20px;
                            }

                            a:hover {
                                text-decoration: underline;
                            }
                        </style>
                    </head>
                    <body>
                        <h3><span class="update">Update</span><span class="game"> Game Info</span></h3>
                        <form name="updateForm" action="/applyUpdate" method="post">
                            <br><br>
                            Game ID(Can't be changed): <br>
                            <input type="text" name="gid" value="${gid}" readonly > <br>
                            Name:<br>
                            <input type="text" name="name" value="${name}"  > <br>
                            Price:<br>
                            <input type="text" name="price" value="${price}"  > <br>
                            Publisher:<br>
                            <input type="text" name="publisher" value="${publisher}"  > <br>
                            Player Type:<br>
                            <input type="text" name="player_type" value="${player_type}"  > <br><br>
                            <div class="update-button">
                                <input type="submit" value="Update">
                            </div>
                        </form>
                        <br><br>
                        <a href="/menu">Back to Main Menu</a>
                    </body>
                </html>`;
            res.send(html2);
        }
    });
});

app.post("/applyUpdate", function (req, res) {
                var gid = req.body.gid; // Remove extra spaces from the name
                var name = req.body.name;
                var price = req.body.price;
                var publisher = req.body.publisher;
                var play_type = req.body.player_type;

                if (play_type === 'Singleplayer') {
                    play_type = 1;
                }
                else if (play_type === 'Singleplayer, Multiplayer Co-op') {
                    play_type = 2;
                }
                else if (play_type === 'Singleplayer, Multiplayer Co-op, Multiplayer Cross-Platform') {
                    play_type = 3;
                }
                else if (play_type === 'Multiplayer Co-op') {
                    play_type = 4;
                }
                else if (play_type === 'Multiplayer Cross-Platform') {
                    play_type = 5;
                }
                else if (play_type === 'Singleplayer, Multiplayer Cross-Platform') {
                    play_type = 6;
                }
                else if (play_type === 'Multiplayer Co-op, Multiplayer Cross-Platform') {
                    play_type = 7;
                }

                updateQuery = "UPDATE games SET gname = ?, price = ?, publisher = ?, player_type = ? WHERE game_id = ?"
                con.query(updateQuery, [name, price, publisher, play_type, gid], function (err, result, fields) {
                    if (err) {
                        console.error("Error executing SQL query:", err);
                        return res.status(500).send("Internal Server Error");
                    }
                    else {
                        res.redirect("/menu");
                    }
                });
            });


app.post("/delete", function (req, res) {
    var iid = req.body.gid.trim(); // Remove extra spaces from the name
    var confirm = req.body.Confirm
    // Ensure all required fields are filled


    // Get the maximum game_id from the games table
    checkID  = "Select * from inventory where inventory_id = ?"
    deleteGame = "DELETE FROM inventory where inventory_id = ?"
    con.query(checkID, iid, function (err, result, fields) {
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (confirm != "Yes") {
            readAndServe("./deleteGame.html", res, "Check Box not checked");
        }
        else if (result.length == 0) {
            // No matching user found
            readAndServe("./deleteGame.html", res, "Inventory ID does not exist");
        }
        else {
            con.query(deleteGame, iid, function (err, result, fields) {
                if (err) {
                    console.error("Error executing SQL query:", err);
                    return res.status(500).send("Internal Server Error");
                }
                else res.redirect("/menu");
            })
        }
    });
});




// Start the server
app.listen(port, function () {
    console.log("Server is running on port " + port);
});
//*** Authors: Michael Wood, Deston Willis, Chris Hinckley
//*** -- Author identification for each section is labeled
//*** Course Title: CSC 351 Database Management Systems Fall 2023
//*** Submission Data: 12/11/2023
//*** Assignment: Final Project
//*** Purpose of Program: File for server side of the project

// Import express framework, body parser, session, path, file system, and define port number
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const port = 3000;
const path = require("path");
const fs = require('fs');

// Instance of express
const app = express();

//*** Author: Michael Wood
// Set up for session tracking
app.use(session({
    secret: 'k7vghjwmjw9cbrPRV$$$mrkoy',
    resave: false,
    saveUninitialized: true
}));


// Set up middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


// Set up mySQL connection
const mysql = require('mysql');
const con = mysql.createConnection({
    host: "35.232.159.218",
    user: "root",
    password: "Queries42$",
    database: "game_stock"
});

// Connect to the database in mySQL
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Set up reading of HTML files
function readAndServe(path, res, errorMessage = "") {
  fs.readFile(path, function (err, data) {
    res.setHeader('Content-Type', 'text/html');

    // Error message
    data = data.toString().replace("</body>", `<p style="color: red;">${errorMessage}</p></body>`);

    res.end(data);
  });
}


//******************************************************************************
//*** Receive the following GET requests
//******************************************************************************

//*** Author: Michael Wood
// Set up login page to be seen first
app.get("/", function (req, res) {
    readAndServe("./Staff_Login.html", res)
});

// Get to login page
app.get("/Staff_Login", function (req, res) {
    // Set session tracking to null when this page is loaded/when somebody logs out
    req.session.user = null;
    readAndServe("./Staff_Login.html", res);
  });

// Set to add page
app.get("/addGame", function (req, res) {
    readAndServe("./addGame.html", res)
  });

// Get to menu page
app.get("/menu", function (req, res) {
    if (req.session.user) {

        // Get user data (username and password)
        var userData = req.session.user; // Get user information from the session

        // SELECT SQL Operation
        // SQL Query for store inventory
        const sql_query = "SELECT i.inventory_id, g.gname, g.price, g.publisher, g.player_type FROM inventory i JOIN games g USING(game_id)";

        con.query(sql_query, function (err, result, fields) {
            // Send Error
            if (err) {
                console.error("Error executing SQL query:", err);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Builds html string to display data from sql query
            let html = "<html><head><style>";

            // Set up css for the page
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

            // Display user information/verify session tracking
            html += `<h1>Welcome, ${userData.staff_name}!</h1>`;
            html += "<h2>Inventory Menu</h2>";

            // Search dropdown menu + search bar
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

            // Update, Add, and Delete buttons
            html += "<div class='center-button'>";
            html += "<button style='border: none;'><a href='/updateGame'>Update</a></button>";
            html += "<button style='border: none;'><a href='/addGame'>Add Game</a></button>";
            html += "<button style='border: none;'><a href='/deleteGame'>Delete</a></button>";
            html += "<button style='border: none;'><a href='/Staff_Login'>Log Out</a></button><br><br>";
            html += "</div>";
            html += "<table border='1' id='inventoryTable'>";

            html += "<tr>";
            // Now add the column headings for the table, adds sorting arrows for each column as well
            for (var i = 0; i < fields.length; i++) {
                html += `<th onclick='sortTable(${i})'>${fields[i].name.toUpperCase()} <span id='arrow${i}'></span></th>`;
            }
            html += "</tr>";

            // Adds rows of data gathered
            for (var i = 0; i < result.length; i++) {
                // Set up for player_type value
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

                // Set up the rest of the table
                html += "<tr>";
                html += `<td>${result[i].inventory_id}</td>`;
                html += `<td>${result[i].gname}</td>`;
                html += `<td>${result[i].price}</td>`;
                html += `<td>${result[i].publisher}</td>`;
                html += `<td>${playerTypeValue}</td>`;
                html += "</tr>";
            }
            html += "</table>";

            // Adss sorting function for the arrows in each column heading
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

            // Convert values to numbers for the inventory_id/price column
            html += "if (column === 0 || column === 2) {";
            html += "aValue = parseInt(aValue);";
            html += "bValue = parseInt(bValue);";
            html += "} else {";
            html += "aValue = aValue.toLowerCase();";
            html += "bValue = bValue.toLowerCase();";
            html += "}";

            // If either value is NaN, perform string comparison
            // Otherwise, perform numeric comparison
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

            // Send the HTML string
            res.send(html);
        });
    } else {
        // If the user is not authenticated, they are sent back to the login page
        res.redirect("/Staff_Login");
    }
});

// Get new_search page, typically after a new search of information
// This is mainly the menu page, but only gets data according to the search provided
app.get("/new_search", function (req, res) {
    if (req.session.user) {

        // User tracking
        const userData = req.session.user;

        // Set the criteria of the search according to the search dropdown menu
        // Default of search is "name" if nothing is provided
        var criteria = req.query.criteria || "name";
        if (criteria === 'name') {
            criteria = "gname";
        } else if (criteria === 'Publisher') {
            criteria = "publisher";
        } else if (criteria === 'price') {
            criteria = "price";
        }

        // Set the actual search, empty string if nothing is entered
        const desc = req.query.desc || "";

        // SELECT SQL Operation
        // SQL Query according to search criteria and description
        const sql_query = `SELECT i.inventory_id, g.gname, g.price, g.publisher, g.player_type 
                           FROM inventory i JOIN games g USING(game_id)
                           WHERE ${criteria} LIKE ?`;

        con.query(sql_query, [`%${desc}%`], function (err, result, fields) {
            // Error Tracking
            if (err) {
                console.error("Error executing SQL query:", err);
                res.status(500).send("Internal Server Error");
                return;
            }

            // Set up the HTML string
            let html = "<html><head><style>";

            // Set up css for the page
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

            // Display user information/verify session tracking
            html += `<h1>Welcome, ${userData.staff_name}!</h1>`;
            html += "<h2>Inventory Menu</h2>";

            // Search dropdown menu + bar
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

            // Set up the table
            html += "<body><table border=1 id=\"inventoryTable\"><br><br>";

            // Display the table columns with sorting arrows in each column
            html += "<tr>";
            for (var i = 0; i < fields.length; i++) {
                html += `<th onclick=\"sortTable(${i})\">${fields[i].name.toUpperCase()} <span id=\"arrow${i}\"></span></th>`;
            }
            html += "</tr>";

            // Display rows of data
            for (var i = 0; i < result.length; i++) {
                // Set up for player_type
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

                // Display the rest of the table
                html += "<tr>";
                html += `<td>${result[i].inventory_id}</td>`;
                html += `<td>${result[i].gname}</td>`;

                html += `<td>${result[i].price}</td>`;
                html += `<td>${result[i].publisher}</td>`;
                html += `<td>${playerTypeValue}</tr></td>`;
            }

            html += "</table>";

            // Link back to the main menu page (displays all inventory)
            html += "<p><a href=\"/menu\">Back to Main Inventory Page</a></p>";

            // Adds sorting function for all arrows in each column
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

            // Convert values to numbers for the inventory_id/price column
            html += "        if (column === 0 || column === 2) {";
            html += "            aValue = parseInt(aValue);";
            html += "            bValue = parseInt(bValue);";
            html += "        } else {";
            html += "            aValue = aValue.toLowerCase();";
            html += "            bValue = bValue.toLowerCase();";
            html += "        }";

             // If either value is NaN, perform string comparison
             // Otherwise, perform numeric comparison
            html += "        if (isNaN(aValue) || isNaN(bValue)) {";
            html += "            return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);";
            html += "        } else {";
            html += "            return ascending ? aValue - bValue : bValue - aValue;";
            html += "        }";
            html += "    });";
            html += "    rows.forEach(row => table.appendChild(row));";
            html += "}";
            html += "</script></html>";

            // Send the HTML string
            res.send(html);
        });
    } else {
        // If the user is not authenticated, they are sent back to the login page
        res.redirect("/Staff_Login");
    }
});

//*** Author: Deston Willis
// Get to update page
app.get("/updateGame", function (req, res) {
    readAndServe("./updateGame.html", res)
});

// Get to delete page
app.get("/deleteGame", function (req, res) {
    readAndServe("./deleteGame.html", res)
});


//******************************************************************************
//*** POST requests:
//******************************************************************************

//*** Author: Michael Wood
// login page
app.post("/Staff_Login", function (req, res) {

    // Get username and password from information entered on the page
    var username = req.body.uname.trim();
    var password = req.body.pword.trim();

    // SELECT SQL Operation
    // Gather info that matches information entered
    var sql_query = "SELECT * " +
        "FROM login l " +
        "JOIN login_staff ls USING(username) " +
        "JOIN staff sta USING(staff_id) " +
        "WHERE l.username = ? AND l.password = ?";

    console.log("Executing SQL query:", sql_query);
    con.query(sql_query, [username, password], function (err, result, fields) {
        // Error tracking
        if (err) {
            console.error("Error executing SQL query:", err);
            res.status(500).send("Internal Server Error");
            return;
        } else {
            // Valid information, get menu page, set session tracking
            if (result.length > 0) {
                req.session.user = result[0];
                res.redirect("/menu");
            } else {
                // Invalid information or user not found
                readAndServe("./Staff_Login.html", res, "Invalid username or password");
            }
        }
    });
});

// Add Function
app.post("/add", function (req, res) {

    // Get variables to add
    var name = req.body.name_desc.trim(); // Remove extra spaces from the name
    var pri = req.body.price_desc || null; // Make price, publisher, player_type optional
    var publ = req.body.publisher_desc || null;
    var play_type = req.body.player_type_desc || null;
    var g_id = -1;

    // Checking that fields are full
    if (!name) {
        return res.status(400).send("Name is required");
    }

    // SELECT SQL Operation
    // Select the maximum ID from the games table
    const select_max_game_id = `SELECT MAX(game_id) AS max_game_id FROM games`;

    con.query(select_max_game_id, function (err, result, fields) {
        // Error checking
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }

        // Set max game ID and game ID variables
        const max_game_id = result[0].max_game_id || 0;
        g_id = max_game_id + 1;

        // SELECT SQL Operation
        // Check if the game already exists in the table
        const select_game = `SELECT * FROM games WHERE gname = ?`;

        con.query(select_game, [name], function (err, result, fields) {
            // Error checking for SQL statement
            if (err) {
                console.error("Error executing SQL query:", err);
                return res.status(500).send("Internal Server Error");
            }

            // Check if the game already exists, add pre-existing game info here
            if (result.length > 0) {
                // Game already exists, use existing game_id
                g_id = result[0].game_id;
                name = result[0].gname;
                pri = result[0].price;
                publ = result[0].publisher;
                play_type = result[0].player_type;
            } else {
                // Game does not exist, insert into the games table

                // Set up for player_type variable
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

                // INSERT INTO SQL Operation
                // Inserts new game into the games table
                const insert_game = `INSERT INTO games (gname, price, publisher, player_type) VALUES (?, ?, ?, ?)`;

                con.query(insert_game, [name, pri, publ, play_type], function (err, result, fields) {
                    // Error checking for SQL Statement
                    if (err) {
                        console.error("Error executing SQL query:", err);
                        return res.status(500).send("Internal Server Error");
                    }
                });
            }

            // INSERT INTO SQL Operation
            // Inserts new inventory item into inventory table
            const insert_inventory = `INSERT INTO inventory (game_id) VALUES (?)`;

            con.query(insert_inventory, [g_id], function (err, result, fields) {
                // Error checking for SQL statement
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

//*** Authors: Michael Wood, Deston Willis
// Update Function
app.post("/update", function (req, res) {
    // Get inventory ID entered
    var invent_id = req.body.iid;

    // SELECT SQL Operation
    // Get the maximum game_id from the games table
    checkID  = "Select * from inventory join games using(game_id) where inventory_id = ?"
    con.query(checkID, invent_id, function (err, result, fields) {
        // Error checking for SQL statement
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (result.length === 0) {
            // No inventory item found
            readAndServe("./updateGame.html", res, "Inventory ID does not exist");
        }
        else {
            // Inventory item found

            // Set up game variables
            const gid = result[0].game_id;
            var name = result[0].gname;
            var price = result[0].price;
            var publisher = result[0].publisher
            var player_type = result[0].player_type;

            // Set up html string
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

//*** Author: Deston Willis
// Applying the update function
app.post("/applyUpdate", function (req, res) {
    // Set up variables
    var gid = req.body.gid;
    var name = req.body.name;
    var price = req.body.price;
    var publisher = req.body.publisher;
    var play_type = req.body.player_type;

    // Set up player_type variable
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

    // UPDATE SQL Operation
    // Updates the selected game info
    updateQuery = "UPDATE games SET gname = ?, price = ?, publisher = ?, player_type = ? WHERE game_id = ?"
    con.query(updateQuery, [name, price, publisher, play_type, gid], function (err, result, fields) {
        // Error checking for SQL statement
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }
        else {
            // Redirect to main menu page
            res.redirect("/menu");
        }
    });
});

//*** Authors: Michael Wood, Deston Willis
// Delete function
app.post("/delete", function (req, res) {
    // Set up variables
    var iid = req.body.gid.trim();
    var confirm = req.body.Confirm;
    // Ensure all required fields are filled

    // SELECT SQL Operation
    // Selects the inventory id entered
    checkID  = "Select * from inventory where inventory_id = ?";

    // DELETE SQL Operation
    // Deletes the selected inventory id from the data
    deleteGame = "DELETE FROM inventory where inventory_id = ?";
    con.query(checkID, iid, function (err, result, fields) {
        // Error checking for SQL statement
        if (err) {
            console.error("Error executing SQL query:", err);
            return res.status(500).send("Internal Server Error");
        }
        if (confirm != "Yes") {
            // Ensure check box is checked
            readAndServe("./deleteGame.html", res, "Check Box not checked");
        }
        else if (result.length == 0) {
            // Inventory id not found
            readAndServe("./deleteGame.html", res, "Inventory ID does not exist");
        }
        else {
            con.query(deleteGame, iid, function (err, result, fields) {
                // Error checking for SQL statement
                if (err) {
                    console.error("Error executing SQL query:", err);
                    return res.status(500).send("Internal Server Error");
                }
                // Redirect to main menu page once successful
                else res.redirect("/menu");
            })
        }
    });
});

// Start the server
app.listen(port, function () {
    console.log("Server is running on port " + port);
});
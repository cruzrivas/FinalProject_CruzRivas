const express = require("express");
const path = require("path");
const app = express();
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.CRUNCHY_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
console.log("Successful connection to the database");

const sql_create = `CREATE TABLE IF NOT EXISTS customer (
  cusId        INTEGER PRIMARY KEY,
  cusFname     VARCHAR(20) NOT NULL,
cusLname     VARCHAR(30) NOT NULL,
cusState     CHAR(2),
cusSalesYTD  MONEY,
cusSalesPrev MONEY
);`;
pool.query(sql_create, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Customer' table");
  // Database seeding
  const sql_insert = `INSERT INTO Customers (cusId, cusFname, cusLname, cusState, cusSalesYTD, 
cusSalesPrev)
VALUES 
(101, 'Alfred', 'Alexander', 'NV', 1500, 900),
(102, 'Cynthia', 'Chase', 'CA', 900, 1200),
(103, 'Ernie', 'Ellis', 'CA', 3500, 4000),
(104, 'Hubert', 'Hughes', 'CA', 4500, 2000),
(105, 'Kathryn', 'King', 'NV', 850, 500),
(106, 'Nicholas', 'Niles', 'NV', 500, 400),
(107, 'Patricia', 'Pullman', 'AZ', 1000, 1100),
(108, 'Sally', 'Smith', 'NV', 1000, 1100),
(109, 'Shelly', 'Smith', 'NV', 2500, 0),
(110, 'Terrance', 'Thomson', 'CA', 5000, 6000),
(111, 'Valarie', 'Vega', 'AZ', 0, 3000),
(112, 'Xavier', 'Xerox', 'AZ', 600, 250);`;
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration

app.listen(3000, () =>  {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  // res.send("Hello world...");
  res.render("index");
});

app.get("/managecustomers", (req, res) => {
  const sql = "SELECT * FROM Customers ORDER BY cusFname"
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("customers", { model: result.rows });
  });
});

const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const pg = require('pg');
const multer = require("multer");
const { Pool } = require("pg");
const upload = multer();

const pool = new Pool({
  connectionString: process.env.CRUNCHY_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(express.static("public"));
app.use(express.static("CSS"));
app.get("/", (req, res) => {
    res.render("index");
});


app.get("/search", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const cus = {
        cus_id: "",
        cus_Fname: "",
        cus_Lname: "",
        cus_state: "",
        cus_salesYTD: "",
        cus_SalesPrev: "",

    };
    res.render("search", {
        type: "get",
        totRecs: totRecs.totRecords,
        cus: cus
    });
});

app.post("/search", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
   dblib.findcustomers(req.body)
        .then(result => {
            console.log("resultis", result)
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                cus: req.body
            })
        })
        .catch(err => {
            console.log("error is", err);
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                prod: req.body
            });
        });
});

app.get( "/createnewcustomer", ( req, res ) => {
  res.render( "createnewcustomer" );
});
app.post( "/createnewcustomer", (req, res ) => {
  dblib.insertcustomer(req.body)
      .then(result => {
          res.render("customercreated", {
              type: "post",
              message: "Customer Created Successfully!"
          })
      })
      .catch(err => {
          res.render("createnewcustomer", {
              type: "post",
              message: "Customer Creation Failed!"
          })
      });
});


const { updatecustomer } = require('./dblib.js');
app.get('/edit/:cusid', (req, res) => {
    var sql = `SELECT * FROM customer WHERE cusid = ${req.params.cusid}`;
    pool.query(sql, (err, result) => {
        if (err) {
            return res.send(err.message);
        }
        res.render('edit', { customer: result.rows[0] });
    });
});

app.post('/edit', (req, res) => {
    var customer = {
        cusid: req.body.cusid,
        cusfname: req.body.cusfname,
        cuslname: req.body.cuslname,
        cusstate: req.body.cusstate,
        cussalesytd: req.body.cussalesytd,
        cussalesprev: req.body.cussalesprev
    };



    updatecustomer(customer)
        .then(result => {
            if (result.trans === "success") {
                res.render(`customerupdated`);
            } else {
                res.render('error', { error: result });
            }
        })
        .catch(err => {
            res.render('error', { error: err });
        });
});

const { deletecustomer } = require('./dblib.js');
app.get('/delete/:cusid', (req, res) => {
    var sql = `SELECT * FROM customer WHERE cusid = ${req.params.cusid}`;
    pool.query(sql, (err, result) => {
        if (err) {
            return res.send(err.message);
        }
        res.render('delete', { customer: result.rows[0] });
    });
});

app.post('/delete', (req, res) => {
    var cusid = req.body.cusid;
    deletecustomer(cusid)
        .then(result => {
            if (result.trans === "success") {
                res.render('customerdeleted', { success_msg: 'Customer Deleted Successfully!' });
            } else {
                res.render('error', { error: result });
            }
        })
        .catch(err => {
            res.render('error', { error: err });
        });
});

app.get("/input", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    res.render("input", {
        type: "get",
        totRecs: totRecs.totRecords,

    });
  });
  
  app.post("/input",  upload.single('filename'), (req, res) => {
     if(!req.file || Object.keys(req.file).length === 0) {
         message = "Error: Import file not uploaded";
         return res.send(message);
     };
     const buffer = req.file.buffer; 
     const lines = buffer.toString().split(/\r?\n/);
     let numRecordsInserted = 0;
     let numRecordsNotInserted = 0;
     let errors = []; 
     lines.forEach(line => {
          product = line.split(",");
      const sql = 'INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)';
          pool.query(sql, product, (err, result) => {
              if (err) {
                  numRecordsNotInserted++;
                  errors.push(`Line: ${line} Error: ${err.message}`);
                  console.log(`Error message: ${err.message}`);
              } else {
                  numRecordsInserted++;
              }
         });
     });
  
     let message = "Import Summary:\n";
     message += `Records Processed: ${lines.length}\n`;
     message += `Records Inserted Successfully: ${numRecordsInserted}\n`;
     message += `Records Not Inserted: ${numRecordsNotInserted}\n`;
     
     errors.forEach(error => {
         message += `${error}\n`;
     });
     res.send(message);
  });
  
  app.get("/output", async (req, res) => {
    var message = "";
    const totRecs = await dblib.getTotalRecords();
    res.render("output",{ 
        message: message,
        type: "get",
        totRecs: totRecs.totRecords});
   });
   
   
   app.post("/output", (req, res) => {
    const sql = "SELECT * FROM customer ORDER BY cusid";
    pool.query(sql, [], (err, result) => {
        var message = "";
        if(err) {
            message = `Error - ${err.message}`;
            res.render("output", { message: message })
        } else {
            var output = "";
            result.rows.forEach(customer => {
                output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd},${customer.cussalesprev}\r\n`;
            });
            
            res.header("Content-Type", "text/plain");
            res.attachment(req.body.filename + ".txt");
            return res.send(output);
        };
    });
 });

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

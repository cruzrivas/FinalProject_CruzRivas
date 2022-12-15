
require("dotenv").config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.CRUNCHY_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log("Successful connection to the database");

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

module.exports.getTotalRecords = getTotalRecords;

const insertcustomer = (customer) => {
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };

    const sql = 'INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)';
    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success", 
                msg: `customer id ${params[0]} successfully inserted`
            };
        })
        .catch(err => {
            return {
                trans: "fail", 
                msg: `Error on insert of customer id ${params[0]}.  ${err.message}`
            };
        });
};

const findcustomers = (customer) => {
    console.log("in findCustomer, customer is:", customer);
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";
     if (customer.cusid !== "") {
        params.push(parseInt(customer.cusid));
        sql += ` AND cusid = $${i}`;
        i++;
    };
    if (customer.cusfname !== "") {
        params.push(`${customer.cusfname}%`);
        sql += ` AND UPPER(cusfname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cuslname !== "") {
        params.push(`${customer.cuslname}%`);
        sql += ` AND UPPER(cuslname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusstate !== "") {
        params.push(parseFloat(customer.cusstate));
        sql += ` AND cusstate >= $${i}`;
        i++;
    };

    sql += ` ORDER BY cusid`;
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

const updatecustomer = (customer) => {
    const sql = 'UPDATE customer SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 WHERE cusid = $6';
    const params = [customer.cusfname, customer.cuslname, customer.cusstate, customer.cussalesytd, customer.cussalesprev, customer.cusid];
    return pool.query(sql, params)
        .then(result => {
            return {
                trans: "success",
                msg: `Customer id ${customer.cusid} successfully updated`
            };
        })
        .catch(err => {
            return {
                trans: "fail",
                msg: `Error on update of customer id ${customer.cusid}.  ${err.message}`
            };
        });
};

const deletecustomer = (cusid) => {
    const sql = 'DELETE FROM customer WHERE cusid = $1';
    const params = [cusid];
    return pool.query(sql, params)
        .then(result => {
            return {
                trans: "success",
                msg: `Customer id ${cusid} successfully deleted`
            };
        })
        .catch(err => {
            return {
                trans: "fail",
                msg: `Error on delete of customer id ${cusid}.  ${err.message}`
            };
        });
};

module.exports.deletecustomer = deletecustomer;
module.exports.updatecustomer = updatecustomer;
module.exports.findcustomers = findcustomers;
module.exports.insertcustomer = insertcustomer;
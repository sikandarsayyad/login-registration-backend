const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
     host:env.db.host,
     user:env.db.user,
     password:env.db.password,
     database:env.db.name,
});

module.exports = pool;
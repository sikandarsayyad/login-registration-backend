const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  db:{
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    name:process.env.DB_NAME,
  },
};

module.exports = env;

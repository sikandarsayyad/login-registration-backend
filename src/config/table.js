const pool = require("./database");

async function createTables() {
  await pool.query(`
          CREATE TABLE IF NOT EXISTS users(
          id INT AUTO_INCREMENT PRIMARY KEY, 
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          mfa_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
     );
   
  await pool.query(`
          CREATE TABLE IF NOT EXISTS otp_challenges(
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          channel ENUM('email', 'sms') NOT NULL, 
          otp_hash VARCHAR(225) NOT NULL,
          expires_at DATETIME NOT NULL,
          attempts INT DEFAULT 0,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`
     );

  
}
module.exports = createTables;

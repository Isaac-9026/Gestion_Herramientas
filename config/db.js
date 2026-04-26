const mysql = require("mysql2/promise");
require("dotenv").config();

if (!process.env.DB_NAME) {
  throw new Error("Falta configurar DB_NAME en .env");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 50,
  timezone: "-05:00",
});

module.exports = pool;

import dotenv from "dotenv"
dotenv.config()
import * as mysql from 'mysql2/promise';
import fs from 'fs'

export const pool = mysql.createPool({
  database: process.env.database, // Replace with your actual database name
  host: process.env.host,
  port: 22701,
  user: process.env.user,
  password: process.env.password,
  connectTimeout: 60000,
  ssl: {
    // Set SSL options
    rejectUnauthorized: false, // Change to false if your MySQL server uses self-signed certificates
    ca: fs.readFileSync('ca.pem'), // Replace with the actual CA certificate content
  },
});
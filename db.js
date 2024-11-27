const mysql = require('mysql2');

// Create a connection pool directly with hardcoded values
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // DB_HOST provided by Railway
    user: process.env.DB_USER,         // DB_USER provided by Railway
    password: process.env.DB_PASSWORD, // DB_PASSWORD provided by Railway
    database: process.env.DB_NAME       // The name of your database
});

// Export the promise-based API for querying
module.exports = pool.promise();

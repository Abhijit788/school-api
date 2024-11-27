const mysql = require('mysql2');

// Create a connection pool directly with hardcoded values
const pool = mysql.createPool({
    host: 'localhost',         // Host for MySQL (localhost if running locally)
    user: 'root',              // MySQL username
    password: '',              // MySQL password (empty in your case)
    database: 'student'        // The name of your database
});

// Export the promise-based API for querying
module.exports = pool.promise();

const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),

    options: {
        encrypt: false,
        trustServerCertificate: true
    },

    connectionTimeout: 15000,
    requestTimeout: 15000
};

console.log("Attempting database connection...");
console.log("Server:", config.server);
console.log("Port:", config.port);
console.log("Database:", config.database);
console.log("User:", config.user);

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("======================================");
        console.log("Connected to SQL Server successfully!");
        console.log("======================================");

        return pool;
    })
    .catch(error => {
        console.error("======================================");
        console.error("Database Connection Failed!");
        console.error("======================================");
        console.error(error.message);

        throw error;
    });

module.exports = {
    sql,
    poolPromise
};
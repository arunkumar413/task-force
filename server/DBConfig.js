const pg = require("pg");
const { Pool } = pg;

module.exports.pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "rbac",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

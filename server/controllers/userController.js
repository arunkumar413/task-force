const { pool } = require("../DBConfig");

module.exports.getUsers = async function (req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const queryText = "select * from users";
    const result = await client.query(queryText);
    await client.query("COMMIT");
    res.json(result.rows);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

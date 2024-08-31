const { pool } = require("../DBConfig");

module.exports.getMyTasks = async function (req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const queryText = "select * from  todos where user_id=$1";
    const result = await client.query(queryText, [req.session.user.id]);
    await client.query("COMMIT");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
};

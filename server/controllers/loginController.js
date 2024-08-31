const { pool } = require("../DBConfig");
const bcrypt = require("bcrypt");

module.exports.registerController = async function (req, res) {
  const saltRounds = 10;
  const client = await pool.connect();

  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(req.body.password, salt);

  try {
    await client.query("BEGIN");
    const queryText =
      "insert into users (username,password,email) values($1,$2,$3)";
    const result = await client.query(queryText, [
      req.body.username,
      hash,
      req.body.email,
    ]);
    await client.query("COMMIT");
    res.status(201).json(result.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.log(err);
  } finally {
  }
};

module.exports.loginController = async function (req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const queryText = "select * from users where email=$1";
    const result = await client.query(queryText, [req.body.email]);
    await client.query("COMMIT");

    let passwordCheckStatus = await bcrypt.compare(
      req.body.password,
      result.rows[0].password
    );

    if (passwordCheckStatus === true) {
      // get user roles
      await client.query("BEGIN");

      let queryText = `select roles.name from users 
      join user_roles on users.id=user_roles.user_id
      join roles on roles.id=user_roles.role_id where users.email=$1`;

      let userRolesObj = await client.query(queryText, [req.body.email]);
      await client.query("COMMIT");

      let userRolesArr = userRolesObj.rows.map(function (item) {
        return item.name;
      });

      let userObj = { ...result.rows[0] };
      delete userObj.password; // remove password from userObj to store in the session
      userObj.roles = userRolesArr;

      req.session.user = userObj;
      req.session.save(function (err) {
        res.json({ statusMessage: "Login success", data: userObj });
      });
    } else {
      res.status(401).send({ statusMessage: "Password didn't match" });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.log(err);
  } finally {
  }
};

module.exports.logoutController = async function (req, res) {
  req.session.destroy(function (err) {
    res.status(200).json({ statusMessage: "Logout success" });
  });
};

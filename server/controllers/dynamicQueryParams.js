module.exports.dynamicQueryParams = async function (req, res, next) {
  try {
    // Extract query parameters from request
    const queryParams = req.query;

    // Construct the SQL query dynamically based on provided filters
    let sql = "SELECT * FROM users WHERE 1=1";
    const values = [];

    let paramIndex = 1;
    for (const param in queryParams) {
      if (Object.hasOwnProperty.call(queryParams, param)) {
        sql += ` AND ${param} = $${paramIndex}`;
        values.push(queryParams[param]);
        paramIndex++;
      }
    }

    // Execute the SQL query
    const { rows } = await pool.query(sql, values);

    res.json(rows);
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

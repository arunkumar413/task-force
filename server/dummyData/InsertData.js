const { pool } = require("../DBConfig");
const { fakeTaskData } = require("./fakeTaskDataInsertIntoDB");

// Load JSON data
const data = fakeTaskData;

// Post

async function insertData() {
  const client = await pool.connect();

  try {
    for (const record of data) {
      // Build the columns and values based on the JSON keys
      const columns = Object.keys(record).join(", ");
      const values = Object.values(record);

      // Create a parameterized query for safer inserts
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const query = `INSERT INTO tasks (${columns}) VALUES (${placeholders})`;

      // Execute the insert query
      await client.query(query, values);
    }

    console.log("Data successfully inserted into PostgreSQL!");
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    await client.end();
  }
}

// Run the function
insertData();

```
select tasks.id as task_id , 
tasks.title,
tasks.created_by,
-- users.id as user_Id,
-- users.email,
comments.id as comm_comment_id,
comments.comment,
attachements.file_name,
attachements.comment_id as att_comm_id,
attachements.link
from tasks 
-- left join users on tasks.created_by=users.id
left join comments on tasks.id=comments.task_id
left join attachements on comments.id=attachements.comment_id
where tasks.created_by=1

```;

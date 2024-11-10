const { pool } = require("../DBConfig");

module.exports.getTaskData = async function (req, res) {
  console.log("######## Task data ##########");
  try {
    const client = await pool.connect();
    let queryText = `select tasks.id as task_id,
 tasks.title as task_title,
 comments.comment,
 comments.task_id,
 comments.id as comment_t_id,
 attachements.id as attch_id,
 attachements.file_name,
 attachements.comment_id as comment_id
 from tasks 
 	  left join comments on comments.task_id= tasks.id
	  left join attachements on attachements.comment_id=comments.id
      where tasks.id= $1

 `;
    const result = await client.query(queryText, [req.params.taskId]);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }
};

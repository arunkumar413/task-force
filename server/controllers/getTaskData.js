const { pool } = require("../DBConfig");

module.exports.getTaskData = async function (req, res) {
  console.log("######## Task data ##########");
  try {
    const client = await pool.connect();
    let queryText = `select tasks.id as task_id,
 tasks.title as task_title,
 tasks.description as description,
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

    let queryTextJson = `SELECT to_jsonb(task) ||
       jsonb_build_object(
	   'created_by', u.username, -- Include the task creator's username
	   'email',u.email,
	   'comments',
       (SELECT jsonb_agg(
                to_jsonb(cm) || jsonb_build_object(
                   'username', u.username,
				    'email',u.email,
                   'attachments', 
                   (SELECT jsonb_agg(to_jsonb(att))
                    FROM attachements AS att
                    WHERE att.comment_id = cm.id)
                )
            )
        FROM comments AS cm
        JOIN users AS u ON cm.user_id = u.id -- Join comments with users
        WHERE cm.task_id = task.id)) AS task_json
FROM tasks AS task
JOIN users AS u ON task.created_by = u.id -- Join tasks with users
WHERE task.id = $1;
`;

    const result = await client.query(queryTextJson, [req.params.taskId]);
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
  }
};

// Modal as a separate component
import React, { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useSelector } from "react-redux";
import {
  Link,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { AttachmentCarousel } from "../components/AttachmentCarousel";
import { fakeAttachmentData } from "../dummyData/fakeAttachmentData";
import { API_URL } from "../constants";
import { transformTaskData } from "../../util";
import { Comment } from "../components/Comment";
import { MicroTasks } from "../components/MicroTasks";
import { FAKE_TASK_DATA } from "../dummyData/fakeTaskData";
import { TaskPageHeader } from "../components/TaskPageHeader";

export function TaskPage() {
  const location = useLocation();
  const selectedTask = useSelector((state) => state.tasks.selectedTask);
  const [transformedData, setTransformedData] = useState(FAKE_TASK_DATA);
  const [newComment, setNewComment] = useState("");

  useEffect(
    function () {
      async function getData() {
        let res = await fetch(`${API_URL}/task-data/${5}`, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "GET",
          credentials: "include",
        });
        if (res.status === 200) {
          let data = await res.json();
          const grouped = Object.groupBy(
            data,
            ({ comment_t_id }) => comment_t_id
          );
          // setTransformedData(data);  // uncomment to use data from DB
        }
      }
      getData();
    },
    [selectedTask]
  );

  const commentCompElements =
    transformedData.length > 0 &&
    transformedData[0].task_json.comments.map(function (item, index) {
      return (
        <Comment
          key={index.toString()}
          email={item.email}
          comment={item.comment}
          attachments={item.attachments}
        />
      );
    });

  function handleCommentInputChange(evt) {
    setNewComment(evt.target.value);
  }

  return (
    <div className="TaskPage">
      <TaskPageHeader
        title={selectedTask.title}
        user={selectedTask.user}
        priority={selectedTask.priority}
        dueDate={selectedTask.dueDate}
        status={selectedTask.status}
        taskId={selectedTask.id}
      />

      <div className="selected-task-page-body">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p className="task-description">
            {transformedData.length > 0 &&
              transformedData[0].task_json.description}
          </p>
          <AttachmentCarousel attachmentData={fakeAttachmentData} />
        </div>
        <MicroTasks />
        <div className="selected-task-page-comments-container">
          {commentCompElements}
        </div>

        <textarea
          style={{ width: "100%" }}
          className="add-comment-box input primary filled"
          placeholder="Add a new comment"
          rows={5}
          cols={100}
          onChange={handleCommentInputChange}
        />
        <button
          disabled={newComment.length > 0 ? false : true}
          className={
            newComment.length > 0
              ? "ser-btn-primary-small"
              : "ser-btn-disabled-small"
          }
          style={{ marginTop: "1rem" }}
        >
          Add comment{" "}
        </button>
      </div>

      <div className="selected-task-modal-footer">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

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
      <div className="selected-task-page-header-title">
        <span className="task-title">{selectedTask.title}</span>

        <div className="selected-task-page-header">
          <div
            className="username-box"
            style={{
              display: "flex",
              justifyContet: "center",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-user"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <p> {selectedTask.user}</p>
          </div>
          <div
            className="task-status-box"
            style={{
              display: "flex",
              justifyContet: "center",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-list-todo"
            >
              <rect x="3" y="5" width="6" height="6" rx="1" />
              <path d="m3 17 2 2 4-4" />
              <path d="M13 6h8" />
              <path d="M13 12h8" />
              <path d="M13 18h8" />
            </svg>
            <p> {selectedTask.status}</p>
          </div>
          <p className={selectedTask.priority.toLowerCase()}>
            {" "}
            {selectedTask.priority}
          </p>
          <p> {new Date(selectedTask.dueDate).toDateString()}</p>
          <Link to={`/task/${selectedTask.id}/edit`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-file-edit"
            >
              <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z" />
            </svg>
          </Link>
        </div>
      </div>

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

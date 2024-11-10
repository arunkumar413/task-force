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

export function TaskPage() {
  const location = useLocation();
  const selectedTask = useSelector((state) => state.tasks.selectedTask);

  const [comments, setComments] = useState([
    {
      comment:
        "### Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      commentedBy: "Arun",
      date: new Date().toISOString(),
    },

    {
      comment:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      commentedBy: "Arun",
      date: new Date().toISOString(),
    },
    {
      comment:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      commentedBy: "Arun",
      date: new Date().toISOString(),
    },
    {
      comment:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      commentedBy: "Arun",
      date: new Date().toISOString(),
    },
  ]);

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
          console.log(JSON.stringify(data));
        }
      }
      getData();
    },
    [selectedTask]
  );

  const commentAttachmentElements = [1, 2, 3, 4, 5].map(function () {
    return (
      <img
        style={{ width: 60, height: 60 }}
        src="https://dummyimage.com/100x100/c9c1c9/121214.png&text=attachment"
      />
    );
  });

  const commentElements = comments.map(function (item, index) {
    return (
      <div key={index.toString()} className="comment-item">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Markdown>{item.comment}</Markdown>
            <div className="comment-footer">
              <span className="commented-by">{item.commentedBy}</span>
              <span className="commented-date">
                {new Date(item.date).toDateString()}
              </span>
            </div>
          </div>
          <div className="comment-attachment-container">
            <AttachmentCarousel attachmentData={fakeAttachmentData} />
          </div>
        </div>
        {/* <p>{item.comment}</p> */}
      </div>
    );
  });

  function addClass(priority) {
    if (priority === "High") {
      return "high";
    } else if (priority === "Low") {
      return "low";
    } else if (priority === "Medium") {
      return "medium-priority";
    } else if (priority === "Urgent") {
      return "urgent";
    } else {
      return "";
    }
  }

  return (
    <div className="TaskPage">
      <div className="selected-task-page-header">
        <h4 className="task-title"> {selectedTask.title}</h4>
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
        <p className={addClass(selectedTask.priority)}>
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

      <div className="selected-task-page-body">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* <p className="task-description">{selectedTask.description}</p> */}
          <p className="task-description">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged. It was popularised in the 1960s
            with the release of Letraset sheets containing Lorem Ipsum passages,
            and more recently with desktop publishing software like Aldus
            PageMaker including versions of Lorem Ipsum.
          </p>

          <AttachmentCarousel attachmentData={fakeAttachmentData} />
        </div>

        <div className="selected-task-page-comments-container">
          {commentElements}
        </div>

        <textarea
          style={{ width: "100%" }}
          className="add-comment-box input primary filled"
          placeholder="Add a new comment"
          rows={5}
          cols={100}
        />
        <button style={{ marginTop: "1rem" }} className="ser-btn-primary-small">
          {" "}
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

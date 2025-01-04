import React from "react";
import { Link } from "react-router-dom";

export function TaskPageHeader({
  title,
  user,
  priority,
  dueDate,
  status,
  taskId,
}) {
  return (
    <div className="selected-task-page-header-title rc-TaskPageHeader">
      <span className="task-title">{title}</span>

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
          <p> {user}</p>
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
          <p> {status}</p>
        </div>
        <p className={priority.toLowerCase()}> {priority}</p>
        <p> {new Date(dueDate).toDateString()}</p>
        <Link to={`/task/${taskId}/edit`}>
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
  );
}

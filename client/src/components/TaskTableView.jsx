import React, { useEffect } from "react";
import { setSelectedTask } from "../store/tasksFilterSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export function TaskTableView({ tasks, label }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  function addClass(priority) {
    if (priority === "High") {
      return "high";
    } else if (priority === "Low") {
      return "low";
    } else if (priority === "Medium") {
      return "medium-priority";
    } else if (priority === "Urgent") {
      return "urgent";
    }
  }

  useEffect(function () {}, [tasks]);

  function handleTaskClick(evt, item) {
    dispatch(setSelectedTask(item));
    navigate("/task/" + item.id, { state: item });
    useNavigate;
  }

  const taskElements = tasks.map(function (item, index) {
    return (
      <div
        key={index.toString()}
        className="task-container"
        onClick={(evt) => handleTaskClick(evt, item)}
      >
        <span> {index + 1}</span>
        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  return (
    <div>
      <h5 className="date-category"> {label} </h5>

      {taskElements}
      <hr />
    </div>
  );
}

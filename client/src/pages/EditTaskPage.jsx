import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Labels } from "../components/Labels";

export function EditTaskPage() {
  const selectedTask = useSelector((state) => state.tasks.selectedTask);
  const [selectedLabels, setSelectedLabels] = useState([]);

  function handleEditTaskInfo() {}

  useEffect(function () {}, [selectedLabels]);

  return (
    <div className="EditTaskPage" style={{ padding: "1rem" }}>
      <div
        style={{
          textAlign: "center",
          backgroundColor: "#f1f3f6",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          marginBottom: "0.5rem",
        }}
        className="new-task-heading round"
      >
        <h2> Edit task</h2>
        <button className="btn primary small filled">Update</button>
      </div>
      <div className="new-task-form">
        <label> Task title </label>
        <input
          value={selectedTask.title}
          name="title"
          onChange={handleEditTaskInfo}
          placeholder="Title"
          className="input small primary filled"
          type="text"
        />

        <div
          className="new-task-second-row"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <label>Priority</label>
          <input
            value={selectedTask.priority}
            onChange={handleEditTaskInfo}
            name="priority"
            type="text"
            list="select-priority"
            className="input small primary filled"
          />
          <datalist id="select-priority">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </datalist>

          <label>Status</label>
          <input
            value={selectedTask.status}
            onChange={handleEditTaskInfo}
            name="status"
            type="text"
            list="select-status"
            className="input small primary filled"
          />
          <datalist id="select-status">
            <option value="In progress">In progress</option>
            <option value="Backlog"> Backlog</option>
            <option value="Done">Done</option>
          </datalist>

          <label> Assign to</label>
          <input
            value={selectedTask.user}
            onChange={handleEditTaskInfo}
            name="user"
            type="text"
            className="input small primary filled"
          />

          <label> Due date</label>
          <input
            value={new Date(selectedTask.dueDate)}
            onChange={handleEditTaskInfo}
            name="dueDate"
            type="date"
            className="input small primary filled"
          />
        </div>

        <label> Description (supports markdown) </label>
        <textarea
          value={selectedTask.description}
          className="input primary filled"
          onChange={handleEditTaskInfo}
          name="description"
          rows={10}
        />

        <p> Select labels</p>
        <Labels
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
        />
      </div>
    </div>
  );
}

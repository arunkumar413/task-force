import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Labels } from "../components/Labels";
import { DropDown } from "../components/DropDown";

export function EditTaskPage() {
  const selectedTask = useSelector((state) => state.tasks.selectedTask);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState("Select priority");
  const [selectedStatus, setSelectedStatus] = useState("Select status");

  function handleEditTaskInfo() {}

  useEffect(function () {}, [selectedLabels]);

  function handleSelectPriority(selItem) {
    setSelectedPriority(selItem);
  }

  function handleSelectStatus(selItem) {
    setSelectedStatus(selItem);
  }

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
        <button className="ser-btn-primary-small">Update</button>
      </div>
      <div className="new-task-form">
        <label> Task title </label>
        <input
          value={selectedTask.title}
          name="title"
          onChange={handleEditTaskInfo}
          placeholder="Title"
          className="ser-input-normal-small-outlined"
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

          <DropDown
            options={["Low", "Medium", "High", "Urgent"]}
            value={selectedPriority}
            handleSelected={handleSelectPriority}
          />

          <label>Status</label>

          <DropDown
            options={["In progress", "Backlog", "Done"]}
            value={selectedStatus}
            handleSelected={handleSelectStatus}
          />

          <label> Assign to</label>
          <input
            value={selectedTask.user}
            onChange={handleEditTaskInfo}
            name="user"
            type="text"
            className="ser-input-normal-small-outlined"
          />

          <label> Due date</label>
          <input
            value={new Date(selectedTask.dueDate)}
            onChange={handleEditTaskInfo}
            name="dueDate"
            type="date"
            className="ser-input-normal-small-outlined"
          />
        </div>

        <label> Description (supports markdown) </label>
        <textarea
          value={selectedTask.description}
          className="ser-input-normal-small-outlined"
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

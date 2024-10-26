import React, { useState } from "react";
import { Labels } from "../components/Labels";
import { DropDown } from "../components/DropDown";
import { SelectLabels } from "../components/SelectLabels";
import { ALL_LABELS } from "../constants";
import { UserSelectDropDown } from "../components/UserSelectDropDown";
import { USER_DATA } from "../dummyData/userData";

export function CreateNewTaskPage() {
  const [selectedOption, setSelectedOption] = useState("Select Priority");
  const [progress, setProgress] = useState("Select progress");
  const [selectedItem, setSelectedItem] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
  });

  const [newTaskInfo, setNewTaskInfo] = useState({
    title: "",
    description: "",
    priority: "",
    status: "",
    user: "",
    dueDate: "",
    labels: [],
  });

  const [selectedLabels, setSelectedLabels] = useState([]);

  function handleNewTaskInfo(evt) {
    setNewTaskInfo(function (prevState) {
      return { ...prevState, [evt.target.name]: evt.target.value };
    });
  }

  return (
    <div className="CreateNewTaskPage">
      <div
        style={{
          backgroundColor: "#f1f3f6",
          textAlign: "center",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          marginBottom: "0.5rem",
        }}
        className="new-task-heading round"
      >
        <h2> Create new task</h2>
        <button className="ser-btn-primary-small ser-round">Save</button>
      </div>
      <div className="new-task-form">
        <label> Task title </label>
        <input
          name="title"
          onChange={handleNewTaskInfo}
          value={newTaskInfo.title}
          placeholder="Title"
          className="ser-input-normal-small-outlined"
          type="text"
        />
        <div
          className="new-task-second-row"
          style={{
            display: "flex",
            flexDirection: "row",
            // gridTemplateColumns: "repeat(8, 1fr)",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <label>Priority</label>

          <DropDown
            options={["Low", "Medium", "High", "Urgent"]}
            value={selectedOption}
            handleSelected={setSelectedOption}
          />

          <label>Status</label>
          <DropDown
            options={["In progress", "Done", "Backlog"]}
            value={progress}
            handleSelected={setProgress}
          />

          <label> Assign to</label>
          {/* <input
            onChange={handleNewTaskInfo}
            name="user"
            type="text"
            className="ser-input-normal-small-outlined"
          /> */}
          <UserSelectDropDown
            inputClassName="ser-input-normal-small-outlined"
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            dropDownData={USER_DATA}
          />

          <label> Due date</label>
          <input
            onChange={handleNewTaskInfo}
            name="dueDate"
            type="date"
            className="ser-input-normal-small-outlined"
          />
        </div>
        <label> Description (supports markdown) </label>
        <textarea
          className="ser-input-normal-small-outlined"
          onChange={handleNewTaskInfo}
          name="description"
          rows={10}
        />
        <p> Select labels</p>
        {/* <Labels
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
        /> */}
        <SelectLabels
          LabelsData={ALL_LABELS}
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
        />
        <br /> <br /> <br /> <br /> <br /> <br />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        ></div>
      </div>
    </div>
  );
}

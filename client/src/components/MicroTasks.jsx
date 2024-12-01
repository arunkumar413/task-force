import React, { useEffect, useState } from "react";
import { FAKE_MICRO_TASKS } from "../dummyData/fakeMicroTasks";

export function MicroTasks() {
  const [microTasks, setMicroTasks] = useState(FAKE_MICRO_TASKS);
  const [transformedData, setTransformedData] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState("");

  const transFormedMicroTasks = microTasks.map(function (item, index) {
    return {
      id: item.id,
      title: item.title,
      isDone: item.isDone,
      isEdit: false,
      isDel: false,
    };
  });

  useEffect(
    function () {
      setTransformedData(transFormedMicroTasks);
    },
    [microTasks]
  );

  function handleEdit(evt, clickedItem) {
    let newData = transformedData.map(function (item, index) {
      if (item.id === clickedItem.id) {
        item.isEdit = true;
        return item;
      } else {
        return item;
      }
    });
    setTransformedData(newData);
  }

  function cancelEdit(evt, clickedItem) {
    let newData = transformedData.map(function (item, index) {
      if (item.id === clickedItem.id) {
        item.isEdit = false;
        return item;
      } else {
        return item;
      }
    });
    setTransformedData(newData);
  }

  function handleNewTaskInput(evt) {
    setNewTaskInput(evt.target.value);
  }

  function addNewTask() {
    let newData = [...microTasks, { title: newTaskInput, isDone: false }];
    setMicroTasks(newData);
  }

  function handleDelMicroTask(evt, clickedItem) {
    let newState = microTasks.filter(function (item, index) {
      return item.title !== clickedItem.title;
    });
    setMicroTasks(newState);
  }

  function handleToggleStatus(evt, clickedItem) {
    let newState = microTasks.map(function (item, index) {
      if (item.title === clickedItem.title) {
        item.isDone = evt.target.checked;
        return item;
      } else {
        return item;
      }
    });
    setMicroTasks(newState);
  }

  function handleChangeTaskTitle(evt, changedItem) {
    let newState = microTasks.map(function (item, index) {
      if (item.id === changedItem.id) {
        item.title = evt.target.value;
        return item;
      } else {
        return item;
      }
    });
    setMicroTasks(newState);
    let newTransFormedState = transformedData.map(function (item, index) {
      if (item.id === changedItem.id) {
        item.isEdit = true;
        return item;
      } else {
        return item;
      }
    });
    setTransformedData(newTransFormedState);
  }

  const microTasksElements = transformedData.map(function (item, index) {
    return (
      <div
        key={item.title}
        className="micro-task-item"
        style={{
          display: "grid",
          justifyContent: "flex-start",
          gridTemplateColumns: "repeat(12,1fr)",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.2rem",
        }}
      >
        {item.isEdit === true ? (
          <input
            style={{ gridColumn: "1/5" }}
            value={item.title}
            type="text"
            onChange={(evt) => handleChangeTaskTitle(evt, item)}
          />
        ) : (
          <p style={{ gridColumn: "1/5" }}> {item.title} </p>
        )}

        <label>
          {" "}
          Done
          <input
            style={{ marginLeft: "0.5rem" }}
            className="ser-checkbox-primary-small "
            type="checkbox"
            checked={item.isDone}
            onChange={(evt) => handleToggleStatus(evt, item)}
          />{" "}
        </label>

        {item.isEdit === true ? (
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
            className="lucide lucide-save"
          >
            <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
            <path d="M7 3v4a1 1 0 0 0 1 1h7" />
          </svg>
        ) : (
          <span> </span>
        )}

        {item.isEdit === false ? (
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
            className="lucide lucide-pencil"
            onClick={(evt) => handleEdit(evt, item)}
          >
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
          </svg>
        ) : (
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
            className="lucide lucide-delete"
            onClick={(evt) => cancelEdit(evt, item)}
          >
            <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
            <path d="m12 9 6 6" />
            <path d="m18 9-6 6" />
          </svg>
        )}
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
          className="lucide lucide-trash-2"
          onClick={(evt) => handleDelMicroTask(evt, item)}
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      </div>
    );
  });

  return (
    <div className="rc-MicroTasks">
      <details className="accordian-secondary-small">
        <summary>Micro Tasks ({microTasks.length}) </summary>
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyItems: "stretch",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "0.2rem",
            }}
          >
            <input
              onChange={handleNewTaskInput}
              className="ser-input-primary-small-outlined"
              type="text"
              placeholder="Add new micro task"
            />{" "}
            <button
              className={
                newTaskInput.length > 0
                  ? "ser-btn-primary-small"
                  : "ser-btn-disabled-small"
              }
              onClick={addNewTask}
            >
              Add
            </button>
          </div>
          {microTasksElements}
        </div>
      </details>
    </div>
  );
}

import React, { useState } from "react";
import {
  ALL_LABELS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  USERS,
} from "../constants";

export function CreateViewPage() {
  const [priorityOptions, setPriority] = useState(PRIORITY_OPTIONS);
  const [statusOptions, setStatus] = useState(STATUS_OPTIONS);
  const [searchLabel, setSearchLabel] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchUserTerm, setUserSearchTerm] = useState("");

  function handlePrioritySelection(evt, index) {
    let newState = priorityOptions.map(function (item, prevIndex) {
      if (index === prevIndex) {
        return { ...item, selected: item.selected === true ? false : true };
      } else {
        return item;
      }
    });

    setPriority(newState);
  }

  function handleStatusSelection(evt, index) {
    let newState = statusOptions.map(function (item, prevIndex) {
      if (index === prevIndex) {
        return { ...item, selected: item.selected === true ? false : true };
      } else {
        return item;
      }
    });
    setStatus(newState);
  }

  const priorityElements = priorityOptions.map(function (item, index) {
    return (
      <label htmlFor={item.option} key={item.option}>
        <input
          style={{ marginRight: "0.2rem" }}
          className="ser-checkbox-primary-small"
          onChange={(evt) => handlePrioritySelection(evt, index)}
          type="checkbox"
          // id="Low"
          name={item.option}
          checked={item.selected}
        />
        {item.option}
      </label>
    );
  });

  const statusElements = statusOptions.map(function (item, index) {
    return (
      <label htmlFor={item.option} key={item.option}>
        <input
          style={{ marginRight: "0.2rem" }}
          className="ser-checkbox-primary-small"
          onChange={(evt) => handleStatusSelection(evt, index)}
          type="checkbox"
          // id="Low"
          name={item.option}
          checked={item.selected}
        />
        {item.option}
      </label>
    );
  });

  function handleLabelInput(evt) {
    setSearchLabel(evt.target.value);
  }

  function handleSelectLabel(evt, newItem) {
    if (!selectedLabels.some((item) => item.name === newItem.name)) {
      setSelectedLabels((prevArray) => [...prevArray, newItem]);
    }
  }

  function handleSelectUser(evt, newItem) {
    if (!selectedUsers.some((item) => item.email === newItem.email)) {
      setSelectedUsers((prevArray) => [...prevArray, newItem]);
    }
  }

  const labelsFound = ALL_LABELS.filter(function (item, index) {
    return item.name.includes(searchLabel);
  });

  const usersFound = USERS.filter(function (item, index) {
    return (
      item.firstName.includes(searchUserTerm) ||
      item.lastName.includes(searchUserTerm) ||
      item.email.includes(searchUserTerm)
    );
  });

  const labelElements = labelsFound.map(function (item, index) {
    return (
      <div
        className="search-label-element"
        key={item.name}
        onClick={(evt) => handleSelectLabel(evt, item)}
        style={{ padding: "0.3rem" }}
      >
        {item.name}
      </div>
    );
  });

  function handleDeleteLabel(evt, clickedItem) {
    let newState = selectedLabels.filter(function (item, index) {
      return item.name !== clickedItem.name;
    });
    setSelectedLabels(newState);
  }

  function handleDeleteUser(evt, clickedItem) {
    let newState = selectedUsers.filter(function (item, index) {
      return item.email !== clickedItem.email;
    });
    setSelectedUsers(newState);
  }

  const selectedLabelElements = selectedLabels.map(function (item, index) {
    return (
      <button
        style={{ cursor: "not-allowed" }}
        onClick={(evt) => handleDeleteLabel(evt, item)}
        key={item.name}
        className="ser-btn-primary-small ser-round"
      >
        {item.name}
      </button>
    );
  });

  const selectedUserElements = selectedUsers.map(function (item, index) {
    return (
      <button
        style={{ cursor: "not-allowed" }}
        onClick={(evt) => handleDeleteUser(evt, item)}
        key={item.email}
        className="ser-btn-primary-small ser-round"
      >
        {item.email}
      </button>
    );
  });

  const userElements = usersFound.map(function (item, index) {
    return (
      <div
        className="search-label-element"
        key={item.id.toString()}
        onClick={(evt) => handleSelectUser(evt, item)}
        style={{ padding: "0.3rem" }}
      >
        {`${item.firstName} ${item.lastName} (${item.email})`}
      </div>
    );
  });

  function handleUserSearchInput(evt) {
    setUserSearchTerm(evt.target.value);
  }

  return (
    <div>
      <div className="create-view-page-header">
        <h2>Create new view </h2>
        <button className="ser-btn-primary-small ser-round"> Save</button>
      </div>
      <div
        className="test2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <div className="create-view-page-selection-container">
          <h3> Select priority</h3>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {priorityElements}
          </div>
        </div>
        <div className="create-view-page-selection-container">
          <h3> Select status</h3>
          <div style={{ display: "flex", gap: "1.5rem" }}>{statusElements}</div>
        </div>
      </div>

      <div
        className="test"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div className="create-view-page-selection-container">
          <h3> Labels</h3>
          <input
            className="ser-input-normal-small-outlined"
            placeholder="Search for a label"
            onChange={handleLabelInput}
          />
          {/* <h5> Labels found</h5> */}
          <div className="search-labels-contianer">{labelElements}</div>

          <h3>Selected labels</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {selectedLabelElements}
          </div>
        </div>

        <div className="create-view-page-selection-container">
          <h3> Users</h3>
          <input
            className="ser-input-normal-small-outlined"
            placeholder="Search for a user"
            onChange={handleUserSearchInput}
          />
          {/* <h5> Labels found</h5> */}
          <div className="search-labels-contianer">{userElements}</div>
          <h3>Selected users</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {selectedUserElements}
          </div>
        </div>
      </div>

      {/* <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          justifyContent: "center",
        }}
      >
        <div className="create-view-page-selection-container">
          <h3>Selected labels</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            {selectedLabelElements}
          </div>
        </div>

        <div
          className="create-view-page-selection-container"
          style={{ gridColumn: "2/3" }}
        ></div>
      </div> */}
    </div>
  );
}

import React, { useState } from "react";
import { ALL_LABELS, PRIORITY_OPTIONS, STATUS_OPTIONS } from "../constants";

export function CreateViewPage() {
  const [priorityOptions, setPriority] = useState(PRIORITY_OPTIONS);
  const [statusOptions, setStatus] = useState(STATUS_OPTIONS);
  const [searchLabel, setSearchLabel] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);

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

  const labelsFound = ALL_LABELS.filter(function (item, index) {
    return item.name.includes(searchLabel);
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

  return (
    <div>
      <div className="create-view-page-header">
        <h2>Create new view </h2>
        <button className="ser-btn-primary-small ser-round"> Save</button>
      </div>
      <div className="create-view-page-selection-container">
        <h3> Select priority</h3>
        <div style={{ display: "flex", gap: "1.5rem" }}>{priorityElements}</div>
      </div>
      <div className="create-view-page-selection-container">
        <h3> Select status</h3>
        <div style={{ display: "flex", gap: "1.5rem" }}>{statusElements}</div>
      </div>
      <div className="create-view-page-selection-container">
        <h3> Labels</h3>
        <input
          className="ser-input-normal-small-outlined"
          placeholder="Search for a label"
          onChange={handleLabelInput}
        />
        {/* <h5> Labels found</h5> */}
        <div className="search-labels-contianer">{labelElements}</div>
      </div>

      <div className="create-view-page-selection-container">
        <h3>Selected labels</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          {selectedLabelElements}
        </div>
      </div>
    </div>
  );
}

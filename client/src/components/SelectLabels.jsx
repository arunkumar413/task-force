import React, { useState } from "react";

export function SelectLabels({
  LabelsData,
  selectedLabels,
  setSelectedLabels,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  function handleSelectLabel(evt, newItem) {
    if (!selectedLabels.some((item) => item.name === newItem.name)) {
      setSelectedLabels((prevArray) => [...prevArray, newItem]);
    }
  }

  const labelsFound = LabelsData.filter(function (item, index) {
    return item.name.toLowerCase().includes(searchTerm);
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

  function handleSearchInput(evt) {
    setSearchTerm(evt.target.value);
  }

  return (
    <div className="rc-SelectLabels">
      <input
        onChange={handleSearchInput}
        className="ser-input-normal-small-outlined"
        placeholder="Search for a label"
      />

      <div className="search-labels-contianer">{labelElements}</div>

      <h3>Selected labels</h3>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {selectedLabelElements}
      </div>
    </div>
  );
}

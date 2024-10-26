import React, { useState } from "react";

export function UserSelectDropDown({
  dropDownData,
  selectedItem,
  setSelectedItem,
  inputClassName,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropDown, setShowDropDown] = useState(false);

  function handleSelect(evt, item) {
    setSelectedItem(item);
    setShowDropDown(false);
  }

  function handleInputChange(evt) {
    setSearchTerm(evt.target.value);
    setSelectedItem({ ...selectedItem, email: evt.target.value });
    if (evt.target.value !== "") {
      setShowDropDown(true);
    } else {
      setShowDropDown(false);
    }
  }

  const filteredoptions = dropDownData.filter(function (item, index) {
    return (
      item.firstName.toLowerCase().includes(searchTerm) ||
      item.lastName.toLowerCase().includes(searchTerm) ||
      item.email.includes(searchTerm)
    );
  });

  const optionElements = filteredoptions.map(function (item, index) {
    return (
      <span
        onClick={(evt) => handleSelect(evt, item)}
        className="drop-down-option"
        key={item.email}
      >
        {item.firstName} {item.lastName} ({item.email})
      </span>
    );
  });

  return (
    <div>
      {" "}
      <input
        className={inputClassName}
        value={selectedItem.email}
        onChange={handleInputChange}
      />{" "}
      <div
        className={showDropDown ? "drop-down-list-show" : "drop-down-list-hide"}
      >
        {optionElements}
      </div>
    </div>
  );
}

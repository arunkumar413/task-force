import React, { Fragment, useState } from "react";

export function DropDown({ options, value, handleSelected }) {
  const [selectedOption, setSelectedOption] = useState(value);

  function handleSelect(evt, item) {
    handleSelected(item);
  }

  const optionElements = options.map(function (item, index) {
    return (
      <>
        <li onClick={(evt) => handleSelect(evt, item)}>{item}</li>
      </>
    );
  });

  return (
    <div class="dropdown">
      <button className="btn primary small outlined" style={{textAlign:"center",verticalAlign:"middle"}} >
        {" "}
        {value}
        <svg
        //  style={{verticalAlign:"middle"}}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-down"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>{" "}
      </button>
      <ol class="dropdown-content">{optionElements}</ol>
    </div>
  );
}

<input />;

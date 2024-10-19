import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Labels } from "./Labels";

export function TaskPageSidebarContent() {
  // const labels= useSelector(state=>state.selectedTask.labels)
  // [selectedLabels,setSelectedLabels]= useState(labels)

  const [labels, setLabels] = useState(["bug", "feature", "enhancement"]);
  const labelElements = labels.map(function (item, index) {
    return (
      <span className="ser-tag-primary-filled ser-round" key={index.toString()}>
        {" "}
        {item}{" "}
      </span>
    );
  });

  return (
    <>
      <h3> Lables</h3>
      <div style={{ display: "flex", gap: "0.5rem" }}>{labelElements}</div>
    </>
  );
}

import React, { useEffect, useState } from "react";
// import { isHighSelected, isLowSelected, isMediumSelected, isUrgentSelected } from "../appState/taskFilterAtoms";
import { useRecoilState } from "recoil";
import { useDispatch, useSelector } from "react-redux";
import {
  categorizeTasks,
  filterTasks,
  increment,
  setHighSelected,
  setLowSelected,
  setMediumSelected,
  setUrgentSelected,
} from "../store/tasksFilterSlice";

export function HomeSideBarContent() {
  const count = useSelector((state) => state.value);
  const isLowSelected = useSelector((state) => state.tasks.isLowSelected);
  const isMediumSelected = useSelector((state) => state.tasks.isMediumSelected);
  const isHighSelected = useSelector((state) => state.tasks.isHighSelected);
  const isUrgentSelected = useSelector((state) => state.tasks.isUrgentSelected);

  const dispatch = useDispatch();

  function handleLowChange() {
    // setLowSelected(!lowSelected)
    dispatch(setLowSelected());
  }

  function handleMediumChange() {
    dispatch(setMediumSelected());
  }

  function handleIncrement() {
    dispatch(increment());
  }

  useEffect(
    function () {
      dispatch(filterTasks());
      dispatch(categorizeTasks());
    },
    [isLowSelected, isMediumSelected, isHighSelected, isUrgentSelected]
  );

  return (
    <>
      <h4> Select priority </h4>
      <input
        onChange={handleLowChange}
        type="checkbox"
        id="Low"
        name="Low"
        checked={isLowSelected}
      />
      <label htmlFor="Low"> Low</label> <br />
      <input
        onChange={handleMediumChange}
        checked={isMediumSelected}
        type="checkbox"
        id="Medium"
        name="Medium"
      />
      <label htmlFor="Medium"> Medium</label> <br />
      <input
        onChange={() => dispatch(setHighSelected())}
        checked={isHighSelected}
        type="checkbox"
        id="High"
        name="High"
      />
      <label htmlFor="High"> High</label> <br />
      <input
        onChange={() => dispatch(setUrgentSelected())}
        checked={isUrgentSelected}
        type="checkbox"
        id="Urgent"
        name="Urgent"
      />
      <label htmlFor="Urgent"> Urgent</label> <br />
      <h4> Select task status </h4>
      <input
        type="checkbox"
        id="in-progress"
        name="in-progress"
        value="In progress"
      />
      <label htmlFor="in-progress"> In progress</label> <br />
      <input type="checkbox" id="done" name="done" value="Done" />
      <label htmlFor="done"> Done</label> <br />
      <input type="checkbox" id="backlog" name="backlog" value="Backlog" />
      <label htmlFor="backlog"> Backlog</label> <br />
      <input type="checkbox" id="canceled" name="canceled" value="Canceled" />
      <label htmlFor="canceled"> Canceled</label> <br />
      <h4> Select labels </h4>
      <input type="checkbox" id="ui" name="ui" value="UI/UX" />
      <label htmlFor="ui"> UI/UX</label> <br />
      <input type="checkbox" id="frontend" name="frontend" value="Frontend" />
      <label htmlFor="front-end"> Frontend</label> <br />
      <input type="checkbox" id="backend" name="backend" value="Backend" />
      <label htmlFor="backend"> Backend</label> <br />
      <input type="checkbox" id="docs" name="docs" value="docs" />
      <label htmlFor="docs"> Documentation</label> <br />
      <input type="checkbox" id="testing" name="testing" value="testing" />
      <label htmlFor="testing"> Testing</label> <br />
    </>
  );
}

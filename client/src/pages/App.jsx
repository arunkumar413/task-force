import React, { useEffect, useState } from "react";
// import "./styles.css";
import { tasks } from "../store/tasks";
// import { sortItems } from "./sort";
import {
  addWeeks,
  endOfTomorrow,
  add,
  addMonths,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import { IsDateFallsInNextWeek, isDateFallsInNextMonth } from "../../util";
// import { TaskModal } from "./components/TaskModal";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import {
  isHighSelected,
  isLowSelected,
  isMediumSelected,
  isUrgentSelected,
} from "../store/taskFilterAtoms";
import { useDispatch, useSelector } from "react-redux";
import {
  categorizeTasks,
  filterTasks,
  setSelectedTask,
  sortTasksByDate,
} from "../store/tasksFilterSlice";

export default function App() {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const todayTasks = useSelector((state) => state.tasks.today);
  const tomorrowTasks = useSelector((state) => state.tasks.tomorrow);
  const thisWeekTasks = useSelector((state) => state.tasks.thisWeek);
  const nextWeekTasks = useSelector((state) => state.tasks.nextWeek);
  const thisMonthTasks = useSelector((state) => state.tasks.thisMonth);
  const nextMonthTasks = useSelector((state) => state.tasks.nextMonth);

  function addClass(priority) {
    if (priority === "High") {
      return "high";
    } else if (priority === "Low") {
      return "low";
    } else if (priority === "Medium") {
      return "medium-priority";
    } else if (priority === "Urgent") {
      return "urgent";
    }
  }

  function handleTaskClick(evt, item) {
    dispatch(setSelectedTask(item));
    navigate("/task/" + item.id, { state: item });
  }

  useEffect(function () {
    dispatch(sortTasksByDate());
    dispatch(filterTasks());
    dispatch(categorizeTasks());
  }, []);

  useEffect(function () {
    async function fetchTasks() {
      let res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userCred),
      });
    }
  }, []);

  const todayElements = todayTasks.map(function (item, index) {
    return (
      <div
        onClick={(evt) => handleTaskClick(evt, item)}
        key={index.toString()}
        className="task-container"
      >
        <span> {index + 1}</span>
        <span className="task-table-task-title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  const tomorrowElements = tomorrowTasks.map(function (item, index) {
    return (
      <div key={index.toString()} className="task-container">
        <span> {index + 1}</span>
        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  const thisWeekElements = thisWeekTasks.map(function (item, index) {
    return (
      <div key={index.toString()} className="task-container">
        <span> {index + 1}</span>

        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  const NextWeekElements = nextWeekTasks.map(function (item, index) {
    return (
      <div key={index.toString()} className="task-container">
        <span> {index + 1}</span>

        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  const thisMonthElements = thisMonthTasks.map(function (item, index) {
    return (
      <div key={index.toString()} className="task-container">
        <span> {index + 1}</span>

        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  const nextMonthElements = nextMonthTasks.map(function (item, index) {
    return (
      <div key={index.toString()} className="task-container">
        <span> {index + 1}</span>

        <span className="title"> {item.title} </span>
        <span className={addClass(item.priority)}> {item.priority} </span>
        <span> {item.status} </span>
        {/* <span> {new Date(item.dueDate).toLocaleString()} </span> */}
        <span> {item.user} </span>
        {/* <span> {item.dueDate} </span> */}
      </div>
    );
  });

  return (
    <div>
      <div className="App">
        <div className="task-header">
          <span> Sl.no/ID</span>
          <span>Title</span>
          <span>Priority</span>
          <span>Status</span>
          <span>User</span>
          {/* <span>Due date</span> */}
        </div>
        <div className="all-tasks-container">
          <h5 className="date-category"> Today </h5>
          {todayElements}
          <hr />
          <h5 className="date-category"> Tomorrow </h5>
          {tomorrowElements}
          <hr />

          <h5 className="date-category"> This week </h5>
          {thisWeekElements}
          <hr />

          <h5 className="date-category"> Next week </h5>
          {NextWeekElements}
          <hr />

          <h5 className="date-category"> This month </h5>
          {thisMonthElements}
          <hr />

          <h5 className="date-category"> Next month </h5>
          {nextMonthElements}
          <hr />
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { categorizeTasks, increment } from "../store/taskViewSlice";
import { API_URL } from "../constants";
import { TaskTableView } from "../components/TaskTableView";

export function ViewPage() {
  const { viewId } = useParams();
  const dispatch = useDispatch();
  const selViewTasks = useSelector((state) => state.taskView.selectedViewTasks);

  const todayTasks = useSelector((state) => state.taskView.todayTasks);
  const tomorrowTasks = useSelector((state) => state.taskView.tomorrowTasks);
  const thisWeekTasks = useSelector((state) => state.taskView.thisWeekTasks);
  const nextWeekTasks = useSelector((state) => state.taskView.nextWeekTasks);
  const thisMonthTasks = useSelector((state) => state.taskView.thisMonthTasks);
  const nextMonthTasks = useSelector((state) => state.taskView.nextMonthTasks);

  function handleClick() {
    dispatch(increment());
  }

  useEffect(() => {
    async function fetchTasks() {
      try {
        let res = await fetch(`${API_URL}/view/${viewId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Parse the response
        let data = await res.json();
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }

    fetchTasks();

    return () => {
      // Cleanup code if needed
    };
  }, [viewId]);

  useEffect(
    function () {
      dispatch(categorizeTasks());
    },
    [selViewTasks]
  );

  return (
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
        <TaskTableView tasks={todayTasks} label="Today" />
        <TaskTableView tasks={tomorrowTasks} label="Tomorrow" />
        <TaskTableView tasks={thisWeekTasks} label="This week" />
        <TaskTableView tasks={nextWeekTasks} label="Next week" />
        <TaskTableView tasks={thisMonthTasks} label="This month" />
        <TaskTableView tasks={nextMonthTasks} label="Next month" />
      </div>
    </div>
  );
}

import { createSlice } from "@reduxjs/toolkit";
import { tasks } from "./tasks";
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
import {
  IsDateFallsInNextWeek,
  isDateFallsInNextMonth,
  isDateFallsInThisWeek,
} from "../../util";

export const taskSlice = createSlice({
  name: "taskSlice",
  initialState: {
    value: 0,
    tasksData: tasks,
    sortedTasks: [],
    filteredTasks: [],
    isLowSelected: true,
    isMediumSelected: true,
    isHighSelected: true,
    isUrgentSelected: true,
    selectedTask: {
      title: "My task one",
      dueDate: new Date().toISOString(),
      priority: "High",
      status: "In progress",
      user: "Arun",
      description: " description",
    },
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    thisMonth: [],
    nextMonth: [],
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },

    sortTasksByDate: function (state, action) {
      state.sortedTasks = state.tasksData.sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );
    },
    setLowSelected: function (state, action) {
      state.isLowSelected = !state.isLowSelected;
    },

    setMediumSelected: function (state, action) {
      state.isMediumSelected = !state.isMediumSelected;
    },
    setHighSelected: function (state, action) {
      state.isHighSelected = !state.isHighSelected;
    },
    setUrgentSelected: function (state, action) {
      state.isUrgentSelected = !state.isUrgentSelected;
    },

    filterTasks: function (state, action) {
      let filteredTasks = state.sortedTasks.filter(function (item, index) {
        if (state.isLowSelected && item.priority === "Low") {
          return item;
        } else if (state.isMediumSelected && item.priority === "Medium") {
          return item;
        } else if (state.isHighSelected && item.priority === "High") {
          return item;
        } else if (state.isUrgentSelected && item.priority === "Urgent") {
          return item;
        }
      });

      state.filteredTasks = filteredTasks;
    },
    setSelectedTask: function (state, action) {
      state.selectedTask = action.payload;
    },
    categorizeTasks: function (state, action) {
      let today = [];
      let tomorrow = [];
      let thisWeek = [];
      let nextWeek = [];
      let thisMonth = [];
      let nextMonth = [];
      state.filteredTasks.forEach(function (item) {
        if (isToday(new Date(item.dueDate))) {
          today.push(item);
        } else if (isTomorrow(new Date(item.dueDate))) {
          tomorrow.push(item);
        } else if (isThisWeek(new Date(item.dueDate))) {
          thisWeek.push(item);
        } else if (IsDateFallsInNextWeek(new Date(item.dueDate))) {
          nextWeek.push(item);
        } else if (isThisMonth(new Date(item.dueDate))) {
          thisMonth.push(item);
        } else if (isDateFallsInNextMonth(item.dueDate)) {
          nextMonth.push(item);
        }
      });
      state.today = today;
      state.tomorrow = tomorrow;
      state.thisWeek = thisWeek;
      state.nextWeek = nextWeek;
      state.thisMonth = thisMonth;
      state.nextMonth = nextMonth;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  increment,
  decrement,
  incrementByAmount,
  setLowSelected,
  setMediumSelected,
  setHighSelected,
  setUrgentSelected,
  filterTasks,
  sortTasksByDate,
  categorizeTasks,
  setSelectedTask,
} = taskSlice.actions;

export default taskSlice.reducer;

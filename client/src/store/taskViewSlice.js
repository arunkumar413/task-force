import { createSlice } from "@reduxjs/toolkit";
import { tasks } from "./tasks";
import { isThisMonth, isThisWeek, isToday, isTomorrow } from "date-fns";
import { isDateFallsInNextMonth, IsDateFallsInNextWeek } from "../../util";

const initialState = {
  value: 0,
  selectedViewTasks: tasks,
  todayTasks: [],
  tomorrowTasks: [],
  thisWeekTasks: [],
  nextWeekTasks: [],
  thisMonthTasks: [],
  nextMonthTasks: [],
};

export const taskViewSlice = createSlice({
  name: "taskViewSlice",
  initialState,
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    categorizeTasks: function (state, action) {
      state.value = 10;
      let today = [];
      let tomorrow = [];
      let thisWeek = [];
      let nextWeek = [];
      let thisMonth = [];
      let nextMonth = [];
      state.selectedViewTasks.forEach(function (item) {
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
      state.todayTasks = today;
      state.tomorrowTasks = tomorrow;
      state.thisWeekTasks = thisWeek;
      state.nextWeekTasks = nextWeek;
      state.thisMonthTasks = thisMonth;
      state.nextMonthTasks = nextMonth;
    },
  },
});

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount, categorizeTasks } =
  taskViewSlice.actions;

export default taskViewSlice.reducer;

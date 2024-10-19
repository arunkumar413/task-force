import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import authReducer from "./authSlice";
import taskSlice from "./tasksFilterSlice";
import taskViewSlice from "./taskViewSlice";

export const appStore = configureStore({
  reducer: {
    tasks: taskSlice,
    auth: authReducer,
    taskView: taskViewSlice,
  },
});

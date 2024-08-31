import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import authReducer from "./authSlice";
import taskSlice from "./tasksFilterSlice";

export const appStore = configureStore({
  reducer: {
    tasks: taskSlice,
    auth: authReducer,
  },
});

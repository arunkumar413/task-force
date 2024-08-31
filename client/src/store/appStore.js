import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import authReducer from "./authSlice";

export const appStore = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
  },
});

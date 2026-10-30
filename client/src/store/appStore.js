import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import api from "./apiSlice";
import tasks from "./tasksFilterSlice";
export const appStore = configureStore({ reducer: { auth, api, tasks } });

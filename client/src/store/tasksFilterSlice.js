import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { tasks as sampleTasks } from "./tasks";
import { API_URL } from "../constants";

const DEMO_KEY = "task-force-demo-v1";
function readDemo() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_KEY));
    if (saved && Array.isArray(saved.items) && Array.isArray(saved.views)) return saved;
  } catch {}
  return { items: sampleTasks, views: [] };
}
async function request(path, options = {}) {
  const response = await fetch(API_URL + path, { credentials: "include", ...options,
    headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.statusMessage || "Request failed");
  return payload?.data;
}
export const loadTasks = createAsyncThunk("tasks/load", async (_, { getState }) => {
  const auth = getState().auth;
  const owner = auth.isLoggedin ? auth.id : "demo";
  if (!auth.isLoggedin) return { ...readDemo(), owner };
  const [items, views] = await Promise.all([request("/tasks"), request("/views")]);
  return { items, views, owner };
});
export const saveTask = createAsyncThunk("tasks/save", async (task, { getState, dispatch }) => {
  const { files = [], ...fields } = task;
  if (getState().auth.isLoggedin) {
    let body = JSON.stringify(fields);
    if (files.length) {
      body = new FormData();
      body.append("task", JSON.stringify(fields));
      files.forEach(file => body.append("files", file));
    }
    const result = await request(task.id ? "/tasks/" + task.id : "/tasks", {
      method: task.id ? "PATCH" : "POST", body,
    });
    dispatch(upsertTask(result));
    return result;
  }
  const current = getState().tasks.items.find(item => item.id === task.id) || {};
  const merged = { ...current, ...fields };
  const result = { ...merged, id: merged.id || crypto.randomUUID(), user: merged.user || "Demo user",
    comments: merged.comments || [], subtasks: merged.subtasks || [], attachments: merged.attachments || [] };
  dispatch(upsertTask(result));
  return result;
});
export const deleteTask = createAsyncThunk("tasks/delete", async (id, { getState, dispatch }) => {
  if (getState().auth.isLoggedin) await request("/tasks/" + id, { method: "DELETE" });
  dispatch(removeTask(id));
});
export const postComment = createAsyncThunk("tasks/comment", async ({ id, comment, files = [] }, { getState, dispatch }) => {
  let task;
  if (getState().auth.isLoggedin) {
    let body = JSON.stringify({ comment });
    if (files.length) {
      body = new FormData();
      body.append("comment", comment);
      files.forEach(file => body.append("files", file));
    }
    task = await request("/tasks/" + id + "/comments", { method: "POST", body });
  } else {
    const current = getState().tasks.items.find(item => item.id === id);
    task = { ...current, comments: [...current.comments, { id: crypto.randomUUID(), comment, username: "Demo user", createdAt: new Date().toISOString(), attachments: [] }] };
  }
  dispatch(upsertTask(task));
});
export const saveView = createAsyncThunk("tasks/view", async (view, { getState, dispatch }) => {
  const result = getState().auth.isLoggedin
    ? await request("/views", { method: "POST", body: JSON.stringify(view) })
    : { ...view, id: crypto.randomUUID() };
  dispatch(addView(result));
  return result;
});
const slice = createSlice({
  name: "tasks",
  initialState: { items: [], views: [], owner: null, loading: false, loaded: false, error: "" },
  reducers: {
    upsertTask(state, { payload }) {
      const index = state.items.findIndex(task => task.id === payload.id);
      if (index < 0) state.items.push(payload); else state.items[index] = payload;
    },
    removeTask(state, { payload }) { state.items = state.items.filter(task => task.id !== payload); },
    addView(state, { payload }) { state.views.push(payload); },
    resetTasks(state) { state.items = []; state.views = []; state.loaded = false; state.owner = null; },
  },
  extraReducers: builder => builder
    .addCase(loadTasks.pending, (state, action) => { state.loading = true; state.error = ""; state.requestId = action.meta.requestId; })
    .addCase(loadTasks.fulfilled, (state, { payload, meta }) => {
      if (state.requestId !== meta.requestId) return;
      Object.assign(state, payload, { loading: false, loaded: true });
    })
    .addCase(loadTasks.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return;
      state.loading = false; state.error = action.error.message;
    }),
});
export const { upsertTask, removeTask, addView, resetTasks } = slice.actions;
export function persistDemo(store) {
  store.subscribe(() => {
    const { auth, tasks } = store.getState();
    if (!auth.isLoggedin && tasks.owner === "demo") {
      try { localStorage.setItem(DEMO_KEY, JSON.stringify({ items: tasks.items, views: tasks.views })); } catch {}
    }
  });
}
export default slice.reducer;

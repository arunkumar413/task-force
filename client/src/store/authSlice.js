import { createSlice } from "@reduxjs/toolkit";
const initialState = { username: "", email: "", roles: [], isLoggedin: false, checked: false };
const slice = createSlice({
  name: "auth", initialState,
  reducers: {
    setUserInfo: (state, { payload }) => ({ ...payload, isLoggedin: true, checked: true }),
    logout: () => ({ ...initialState, checked: true }),
  },
});
export const { setUserInfo, logout } = slice.actions;
export default slice.reducer;

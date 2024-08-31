import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  username: "",
  email: "",
  isLoggedin: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.isLoggedin = true;
    },
    logout: function (state, action) {
      state.username = "";
      state.email = "";
      state.isLoggedin = false;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUserInfo, logout } = authSlice.actions;

export default authSlice.reducer;

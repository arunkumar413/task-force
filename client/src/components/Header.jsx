import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useLocalStorage from "./useLocalStorage";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUserInfo } from "../store/authSlice";

export function Header() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(
    function () {
      let userObj = localStorage.getItem("userInfo");
      if (userObj) {
        let userJson = JSON.parse(userObj);
        dispatch(
          setUserInfo({
            username: userJson.username,
            email: userJson.email,
            isLoggedIn: true,
          })
        );
      }
    },
    [auth]
  );

  useEffect(function () {
    let userObj = localStorage.getItem("userInfo");
    if (userObj) {
      let userJson = JSON.parse(userObj);
      dispatch(
        setUserInfo({
          username: userJson.username,
          email: userJson.email,
          isLoggedIn: true,
        })
      );
    }
  }, []);

  async function handleLogout() {
    let res = await fetch("http://localhost:3000/api/logout", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ a: 1, b: 2 }),
      credentials: "include",
    });
    if (res.status === 200) {
      localStorage.removeItem("userInfo");
      dispatch(logout());

      let result = await res.json();
    } else {
      console.log("logout failed");
    }
  }

  return (
    <header>
      <nav
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: "1rem",
        }}
      >
        <Link to="/"> Home </Link>
        <Link to="/contact"> Contact </Link>
        <Link to="/about"> About </Link>
        <Link to="/login"> Login </Link>
        <Link to="/register"> Register </Link>
        {auth.username && <span> Logged in as {auth.email}</span>}
        {auth.username && <button onClick={handleLogout}> Logout </button>}
      </nav>
    </header>
  );
}

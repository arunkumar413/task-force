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
          gridColumn: "1/10",
        }}
      >
        <Link to="/"> Home </Link>
        <Link to="/contact"> Contact </Link>
        <Link to="/about"> About </Link>
        <Link to="/login"> Login </Link>
        <Link to="/register"> Register </Link>
        <Link to="/add-new-task"> New task </Link>

        {auth.username && <span> Logged in as {auth.email}</span>}
        {auth.username && <button onClick={handleLogout}> Logout </button>}
      </nav>
      <div style={{ gridColumn: "11/12" }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-user"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </header>
  );
}

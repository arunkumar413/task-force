import React, { useState } from "react";
import { Header } from "../components/Header";
import useLocalStorage from "../components/useLocalStorage";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUserInfo } from "../store/authSlice";

export function LoginPage() {
  const [userCred, setUserCred] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  async function handleLogin() {
    let res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userCred),
    });
    let result = await res.json();
    localStorage.setItem("userInfo", JSON.stringify(result.data)); // set userinfo to the local storage on successful login
    dispatch(
      setUserInfo({
        username: result.data.username,
        email: result.data.email,
        isLoggedIn: true,
      })
    );
    // navigate("/"); //navigate to home page on sucessfull login
  }

  function handleUserCred(evt) {
    setUserCred(function (prevState) {
      return { ...prevState, [evt.target.name]: evt.target.value };
    });
  }

  return (
    <div className="LoginPage">
      <Header />
      <h2> Login</h2>
      <label htmlFor="email">Email</label>
      <input onChange={handleUserCred} type="email" name="email" />
      <label htmlFor="password">Password</label>
      <input onChange={handleUserCred} type="password" name="password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

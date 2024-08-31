import React, { useState } from "react";
import { Header } from "../components/Header";

export function RegisterUser() {
  const [userInfo, setuserInfo] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleUserInfo(evt) {
    setuserInfo(function (prevState) {
      return { ...prevState, [evt.target.name]: evt.target.value };
    });
  }

  async function handleRegister() {
    let res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userInfo),
    });
  }

  return (
    <div
      className="RegisterUser"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: "1rem",
      }}
    >
      <Header />

      <h2> Register User</h2>
      <div className="form-element-style">
        <label htmlFor="username">Username</label>
        <input
          placeholder="username"
          onChange={handleUserInfo}
          type="text"
          name="username"
        />
      </div>
      <div className="form-element-style">
        <label htmlFor="email">Email</label>

        <input
          placeholder="email"
          onChange={handleUserInfo}
          type="email"
          name="email"
        />
      </div>

      <div className="form-element-style">
        <label htmlFor="password">Password</label>

        <input
          placeholder="password"
          onChange={handleUserInfo}
          type="password"
          name="password"
        />
      </div>

      <div className="form-element-style">
        <label htmlFor="confirmPassword">Confirm password</label>

        <input
          placeholder="confirm password"
          onChange={handleUserInfo}
          type="password"
          name="confirmPassword"
        />
      </div>
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}

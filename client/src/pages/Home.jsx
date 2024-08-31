import React, { useEffect, useState } from "react";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from "recoil";

import "../app.css";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { useSelector, useDispatch } from "react-redux";
import { decrement, increment } from "../store/counterSlice";
import { API_URL } from "../constants";

export function Home() {
  const count = useSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState([]);

  function handleIncrement() {
    dispatch(increment());
  }

  function handleDecrement() {
    dispatch(decrement());
  }

  useEffect(function () {
    async function getData() {
      let res = await fetch(`${API_URL}/mytasks`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
        credentials: "include",
      });
      if (res.status === 200) {
        let data = await res.json();
        setTasks(data);
      }
    }
    getData();
  }, []);

  const taskElements = tasks.map(function (item, index) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          gap: "1rem",
        }}
        key={index.toString()}
      >
        <span style={{ padding: "0.5rem" }}> {item.title}</span>
        <span> {item.status}</span>
      </div>
    );
  });

  const taskHeadingElements = ["Title", "Status"].map(function (item, index) {
    return <h5 key={item}> {item}</h5>;
  });

  return (
    <RecoilRoot>
      <Header />
      <div className="app-component">
        <h1>
          Hello Webpack+React+React router+Redux toolkit + Express + Server side
          session + RBAC
        </h1>
        <h4>count: {count}</h4>
        <button onClick={handleIncrement}>increment</button>
        <button onClick={handleDecrement}>decrement</button>
        <h2 style={{ textAlign: "center" }}> Tasks </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          {taskHeadingElements}
        </div>
        <div>{taskElements}</div>
      </div>
    </RecoilRoot>
  );
}

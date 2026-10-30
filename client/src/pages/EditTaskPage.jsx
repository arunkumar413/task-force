import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { TaskForm } from "../components/TaskForm";
export function EditTaskPage() {
  const { task_id } = useParams();
  const { items, loaded, error } = useSelector(state => state.tasks);
  const task = items.find(item => item.id === task_id);
  if (!loaded) return <p>{error || "Loading task…"}</p>;
  if (!task) return <p>Task not found.</p>;
  return <><h1>Edit task</h1><TaskForm key={task.id} task={task} /></>;
}

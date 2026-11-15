import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
export function GuestOnly({
  children
}) {
  const auth = useSelector(state => state.auth);
  const isLoggedIn = Boolean(auth.isLoggedin || auth.username);
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
}

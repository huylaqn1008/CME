// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import Home from "./pages/Auth/Home.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import AuthProvider from "./contexts/AuthContext";
import DepartmentManager from "./pages/Super Admin/Departments/DepartmentManager.jsx";
import UserManager from "./pages/Super Admin/Users/UserManager.jsx"
import CourseManagement from "./pages/Super Admin/Courses/CourseManager.jsx";
import CourseList from "./pages/User/CourseList.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/users" element={<UserManager />} />
        <Route path="/admin/departments" element={<DepartmentManager />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/user/courses" element={<CourseList />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);


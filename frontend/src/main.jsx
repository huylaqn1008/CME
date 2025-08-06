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
import { SocketProvider } from "./contexts/SocketContext";
import DepartmentManager from "./pages/Super Admin/Departments/DepartmentManager.jsx";
import UserManager from "./pages/Super Admin/Users/UserManager.jsx"
import CourseManagement from "./pages/Super Admin/Courses/CourseManager.jsx";
import CourseList from "./pages/User/CourseList.jsx";
import LiveClassroom from "./pages/LiveClassroom/LiveClassroom.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Tất cả route có Sidebar */}
          <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route path="admin/users" element={<UserManager />} />
            <Route path="admin/departments" element={<DepartmentManager />} />
            <Route path="admin/courses" element={<CourseManagement />} />
            <Route path="user/courses" element={<CourseList />} />
          </Route>

          {/* Các route không có Sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route cho Live Classroom - không có sidebar */}
          <Route path="/live-classroom/:courseId" element={<LiveClassroom />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
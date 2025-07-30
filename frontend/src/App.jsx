import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "./App.css";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <Outlet />
      </main>
    </>
  );
}

import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import logo from "../assets/LOGO.png";
import "./Sidebar.css";

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar glass ${collapsed ? "collapsed" : ""}`}>
      {/* Toggle nút tròn ở giữa bên phải */}
      <button
        className="side-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Mở rộng" : "Thu gọn"}
      >
        {collapsed ? ">>" : "<<"}
      </button>

      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" />
          {!collapsed && <h2>CME App</h2>}
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-menu">
        <Link
          to="/"
          className={`sidebar-item ${isActive("/") ? "active" : ""}`}
          title={collapsed ? "Trang chủ" : ""}
        >
          🏠 {!collapsed && "Trang chủ"}
        </Link>

        {user?.role?.toLowerCase() === "super admin" && (
          <>
            <Link
              to="/admin/users"
              className={`sidebar-item ${isActive("/admin/users") ? "active" : ""}`}
              title={collapsed ? "Quản lý người dùng" : ""}
            >
              👨‍👦‍👦 {!collapsed && "Quản lý người dùng"}
            </Link>
            <Link
              to="/admin/departments"
              className={`sidebar-item ${isActive("/admin/departments") ? "active" : ""}`}
              title={collapsed ? "Quản lý khoa phòng" : ""}
            >
              🏢 {!collapsed && "Quản lý khoa phòng"}
            </Link>
            <Link
              to="/admin/courses"
              className={`sidebar-item ${isActive("/admin/courses") ? "active" : ""}`}
              title={collapsed ? "Quản lý khóa học" : ""}
            >
              📚 {!collapsed && "Quản lý khoá học"}
            </Link>
          </>
        )}

        {user && (
          <Link
            to="/user/courses"
            className={`sidebar-item ${isActive("/user/courses") ? "active" : ""}`}
            title={collapsed ? "Các khoá học" : ""}
          >
            🎓 {!collapsed && "Các khoá học"}
          </Link>
        )}

        {!user && (
          <>
            <Link
              to="/login"
              className={`sidebar-item ${isActive("/login") ? "active" : ""}`}
              title={collapsed ? "Đăng nhập" : ""}
            >
              🔑 {!collapsed && "Đăng nhập"}
            </Link>
            <Link
              to="/register"
              className={`sidebar-item ${isActive("/register") ? "active" : ""}`}
              title={collapsed ? "Đăng ký" : ""}
            >
              📝 {!collapsed && "Đăng ký"}
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      {user && (
        <div className="sidebar-footer">
          {!collapsed && <div className="sidebar-user">👨‍⚕️ {user.full_name}</div>}
          <button className="sidebar-logout" onClick={logout} title="Đăng xuất">
            🚪 {!collapsed && "Đăng xuất"}
          </button>
        </div>
      )}
    </aside>
  );
}

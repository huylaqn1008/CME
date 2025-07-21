import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white shadow mb-4">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">🏥 CME App</h1>
        <div className="space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-500">Trang chủ</Link>

          {user ? (
            <>
              <span className="text-gray-800">👤 {user.full_name}</span>

              {user?.role?.toLowerCase() === "super admin" && (
                <>
                  <Link to="/admin/users" className="text-gray-700 hover:text-blue-500">
                    Quản lý người dùng
                  </Link>
                  <Link to="/admin/departments" className="text-gray-700 hover:text-blue-500">
                    Quản lý khoa phòng
                  </Link>
                  <Link to="/admin/courses" className="text-gray-700 hover:text-blue-500">
                    Quản lý khoá học
                  </Link>
                  <Link to="/user/courses" className="text-gray-700 hover:text-blue-500">
                    Quản lý khoá học
                  </Link>
                </>
              )}

              <button
                onClick={logout}
                className="text-red-600 hover:underline"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-500">Đăng nhập</Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-500">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

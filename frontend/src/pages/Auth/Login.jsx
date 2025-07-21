import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext"; // 👈 nếu có context

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // 👈 Gọi hàm login từ context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      login(res.data.user); // 👈 Gọi hàm login từ context để cập nhật Navbar
      setMessage(res.data.message);
      navigate("/"); // 👈 Không cần delay
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi khi đăng nhập");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Đăng nhập</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border p-2"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Đăng nhập
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 ${message.includes("thành công") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

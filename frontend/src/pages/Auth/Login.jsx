import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import apiClient from "../../config/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      login(res.data.user);
      setMessage(res.data.message);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setMessage(err.response?.data?.message || "Lỗi khi đăng nhập. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
          required
        />
        <input
          type="password"
          className="w-full border p-2"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
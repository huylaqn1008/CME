import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        department_name: "",
    });

    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState("");

    // Lấy danh sách khoa từ server
    useEffect(() => {
        axios
            .get("http://localhost:5000/api/departments")
            .then((res) => setDepartments(res.data))
            .catch(() =>
                setMessage("❌ Không thể tải danh sách khoa. Vui lòng thử lại sau.")
            );
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const { full_name, email, password, department_name } = form;

        // Kiểm tra đầu vào
        if (!full_name || !email || !password || !department_name) {
            return setMessage("❌ Vui lòng điền đầy đủ thông tin");
        }

        if (!email.includes("@")) {
            return setMessage("❌ Email không hợp lệ");
        }

        if (password.length < 6) {
            return setMessage("❌ Mật khẩu phải ít nhất 6 ký tự");
        }

        const isValidDepartment = departments.some(
            (dep) => dep.name === department_name
        );

        if (!isValidDepartment) {
            return setMessage("❌ Khoa không hợp lệ. Vui lòng chọn từ danh sách.");
        }

        try {
            const res = await axios.post(
                "http://localhost:5000/api/auth/register",
                form
            );
            setMessage(res.data.message);
            setForm({
                full_name: "",
                email: "",
                password: "",
                department_name: "",
            });

            // ⏳ Chuyển trang login sau 1.5s
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            setMessage(err.response?.data?.message || "❌ Đăng ký thất bại");
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Đăng ký</h2>
            <form onSubmit={handleRegister} className="space-y-4">
                <input
                    type="text"
                    className="w-full border p-2"
                    placeholder="Họ tên"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    className="w-full border p-2"
                    placeholder="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    className="w-full border p-2"
                    placeholder="Mật khẩu"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                />

                <select
                    name="department_name"
                    className="w-full border p-2"
                    value={form.department_name}
                    onChange={handleChange}
                >
                    <option value="">-- Chọn khoa --</option>
                    {departments.map((dep) => (
                        <option key={dep.name} value={dep.name}>
                            {dep.name}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Đăng ký
                </button>
            </form>

            {message && (
                <p
                    className={`mt-2 ${message.includes("thành công") ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}

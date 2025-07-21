import React, { useEffect, useState } from "react";
import axios from "axios";
import './DepartmentManager.css'

export default function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState("");

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/departments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDepartments(res.data);
    } catch (err) {
      console.error("Lỗi khi tải khoa:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/departments",
        { name: newName },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setNewName("");
      setMessage("✅ Thêm khoa thành công");
      fetchDepartments();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi khi thêm khoa");
    }
  };

  const handleEdit = async () => {
    if (!editName.trim()) return;
    try {
      await axios.put(`http://localhost:5000/api/departments/${editId}`,
        { name: editName },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setEditId(null);
      setEditName("");
      setMessage("✅ Cập nhật khoa thành công");
      fetchDepartments();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá khoa này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/departments/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage("🗑️ Đã xoá khoa");
      fetchDepartments();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi khi xoá khoa");
    }
  };

  return (
    <div className="container">
      <h2>📋 Quản lý Khoa/Phòng</h2>

      {message && <div className="message">{message}</div>}

      <div className="form-group">
        <input
          type="text"
          placeholder="Tên khoa mới"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleAdd}>Thêm</button>
      </div>

      <div className="department-list">
        {departments.map((dept) => (
          <div className="card" key={dept._id}>
            {editId === dept._id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button onClick={handleEdit} className="btn save">Lưu</button>
                <button onClick={() => setEditId(null)} className="btn cancel">Huỷ</button>
              </div>
            ) : (
              <>
                <span className="dept-name">{dept.name}</span>
                <div className="actions">
                  <button onClick={() => {
                    setEditId(dept._id);
                    setEditName(dept.name);
                  }} className="btn edit">Sửa</button>
                  <button onClick={() => handleDelete(dept._id)} className="btn delete">Xoá</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

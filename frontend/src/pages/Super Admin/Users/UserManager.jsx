import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserManager.css";

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 30;

  const [selectedRoleUserId, setSelectedRoleUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const [selectedUserToToggle, setSelectedUserToToggle] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [statusReason, setStatusReason] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  const [filterRole, setFilterRole] = useState("");

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(res.data.users || []);
    } catch (err) {
      setMessage("❌ Lỗi khi tải danh sách người dùng");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = res.data.filter(
        (role) => role.name.toLowerCase() !== "super admin"
      );
      setRoles(filtered);
    } catch (err) {
      console.error("Lỗi khi lấy vai trò:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleChangeRole = async (userId) => {
    if (!selectedRole) {
      setMessage("❗ Vui lòng chọn vai trò mới");
      return;
    }

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/users/${userId}/role`,
        { new_role_name: selectedRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.message);
      fetchUsers();
      setSelectedRoleUserId(null);
      setSelectedRole("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi khi cập nhật vai trò");
    }
  };

  const handleToggleUserStatus = async () => {
    if (!statusReason.trim()) {
      alert("Vui lòng nhập lý do");
      return;
    }

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/users/${selectedUserToToggle.id}/status`,
        { reason: statusReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(res.data.message);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Lỗi khi cập nhật trạng thái");
    } finally {
      setShowReasonModal(false);
      setSelectedUserToToggle(null);
      setStatusReason("");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = allUsers.filter((user) => {
    const matchSearch = `${user.full_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
    const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="admin-users-container">
      <h2>👤 Quản lý người dùng</h2>
      {message && <p className="mb-2" style={{ color: "#dc2626" }}>{message}</p>}

      <div className="admin-filter-bar">
        <input
          type="text"
          placeholder="🔍 Tìm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="admin-role-filter"
        >
          <option value="">-- Tất cả vai trò --</option>
          {roles.map((r) => (
            <option key={r._id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => handleSort("full_name")}>Họ tên</th>
              <th onClick={() => handleSort("email")}>Email</th>
              <th onClick={() => handleSort("role")}>Vai trò</th>
              <th onClick={() => handleSort("department")}>Phòng khoa</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{indexOfFirstUser + index + 1}</td>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.department || "-"}</td>
                  <td>
                    <span className={`status-badge ${user.is_active ? "status-active" : "status-inactive"}`}>
                      {user.is_active ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td>
                    {selectedRoleUserId === user.id ? (
                      <>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <option value="">-- Vai trò mới --</option>
                          {roles.map((r) => (
                            <option key={r._id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                        <button className="admin-button btn-save" onClick={() => handleChangeRole(user.id)}>Lưu</button>
                        <button className="admin-button btn-cancel" onClick={() => { setSelectedRoleUserId(null); setSelectedRole(""); }}>Hủy</button>
                      </>
                    ) : user.role?.toLowerCase() !== "super admin" ? (
                      <>
                        <button className="admin-button btn-edit" onClick={() => { setSelectedRoleUserId(user.id); setSelectedRole(user.role); }}>Đổi vai trò</button>
                        <button
                          className={`admin-button ${user.is_active ? "btn-toggle" : "btn-activate"}`}
                          onClick={() => { setSelectedUserToToggle(user); setShowReasonModal(true); }}
                        >
                          {user.is_active ? "Khóa" : "Mở lại"}
                        </button>
                      </>
                    ) : (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Không thể đổi</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "#6b7280" }}>Không có người dùng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={pageNum === currentPage ? "active" : ""}
          >
            {pageNum}
          </button>
        ))}
      </div>

      {showReasonModal && selectedUserToToggle && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{selectedUserToToggle.is_active ? "🔒 Khóa tài khoản" : "✅ Mở lại tài khoản"}</h3>
            <p>Nhập lý do {selectedUserToToggle.is_active ? "khóa" : "mở lại"} tài khoản <b>{selectedUserToToggle.full_name}</b>:</p>
            <textarea
              rows="3"
              style={{ width: "100%", marginTop: "10px" }}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button className="admin-button btn-cancel" onClick={() => { setShowReasonModal(false); setStatusReason(""); setSelectedUserToToggle(null); }}>Hủy</button>
              <button className="admin-button btn-save" onClick={handleToggleUserStatus}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

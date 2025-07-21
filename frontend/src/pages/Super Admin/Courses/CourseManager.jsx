import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import "./CourseManager.css";
import DepartmentMultiSelect from "./DepartmentMultiSelect";

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    registration_open: "",
    registration_close: "",
    course_datetime: "",
    course_location: "",
    mode: "offline",
    cme_point: "",
    status: "pending",
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setMessage({ text: "❌ Bạn chưa đăng nhập!", type: "error" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
  }, [token]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching courses with token:", token); // Debug

      const res = await axios.get("http://localhost:5000/api/courses/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("Courses data:", res.data); // Debug
      setCourses(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi lấy khóa học:", {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      setMessage({
        text: err.response?.data?.message || "❌ Không thể tải danh sách khóa học",
        type: "error"
      });

      // Nếu lỗi 401 (Unauthorized) thì redirect về login
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    if (token) fetchCourses();
  }, [token]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token check:", token); // Debug

    if (!token) {
      setMessage({ text: "❌ Bạn chưa đăng nhập!", type: "error" });
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return; // Thêm return để dừng nếu không có token
    }

    // Nếu có token thì fetch data
    fetchCourses();

    // Thêm fetch departments nếu cần
    const fetchDepartments = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách khoa:", err);
      }
    };
    fetchDepartments();
  }, []); // Bỏ dependency token để chỉ chạy 1 lần khi mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const dataToSend = { ...formData };

      // Format lại các trường datetime trước khi gửi
      dataToSend.registration_open = new Date(dataToSend.registration_open).toISOString();
      dataToSend.registration_close = new Date(dataToSend.registration_close).toISOString();
      dataToSend.course_datetime = new Date(dataToSend.course_datetime).toISOString();

      if (editingId) {
        await axios.put(`http://localhost:5000/api/courses/${editingId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ text: "✅ Cập nhật khóa học thành công", type: "success" });
      } else {
        await axios.post("http://localhost:5000/api/courses", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ text: "✅ Tạo khóa học thành công", type: "success" });
      }

      // Reset và load lại data
      setFormData({
        title: "",
        description: "",
        registration_open: "",
        registration_close: "",
        course_datetime: "",
        course_location: "",
        mode: "offline",
        cme_point: "",
        status: "pending",
      });
      setEditingId(null);
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      console.error("❌ Lỗi:", err);
      setMessage({
        text: `❌ ${editingId ? "Cập nhật" : "Tạo"} khóa học thất bại: ${err.response?.data?.message || err.message}`,
        type: "error"
      });
    } finally {
      setIsLoading(false); // Sửa từ true thành false
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá khóa học này?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.delete(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "🗑️ Đã xoá khóa học", type: "success" });
      fetchCourses();
    } catch (err) {
      console.error("❌ Lỗi khi xoá khóa học:", err);
      setMessage({
        text: err.response?.data?.message || "❌ Không thể xoá khóa học",
        type: "error"
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === '') {
      fetchCourses();
    } else {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        (course.description && course.description.toLowerCase().includes(searchTerm)) ||
        (course.course_location && course.course_location.toLowerCase().includes(searchTerm))
      );
      setCourses(filtered);
    }
  };

  const formatForDateTimeInput = (dateString) => {
    if (!dateString) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      return dateString;
    }

    const date = new Date(dateString);
    // Thêm timezone offset để hiển thị đúng giờ local
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - offset).toISOString();
    return localISOTime.slice(0, 16);
  };

  return (
    <div className="course-management-container">
      <div className="header-section">
        <h1 className="page-title">Quản lý Khóa học CME</h1>
        <p className="page-description">
          Quản lý các khóa học đào tạo y khoa liên tục
        </p>
      </div>

      {message.text && (
        <div className={`alert-message ${message.type}`}>{message.text}</div>
      )}

      <div className="action-bar">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? (
            "⬅️ Quay lại"
          ) : (
            <>
              <i className="fas fa-plus"></i> Tạo khóa học mới
            </>
          )}
        </button>
      </div>

      {showForm ? (
        <div className="form-container">
          <h2 className="form-title">Thông tin khóa học</h2>
          <form onSubmit={handleSubmit} className="course-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Tên khóa học*</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>

              {/* Thay thế phần select departments cũ bằng component mới */}
              <div className="form-group">
                <label>Khoa/phòng áp dụng</label>
                <DepartmentMultiSelect
                  departments={departments}
                  selectedDepartments={formData.departments || []}
                  onChange={(selected) => setFormData({ ...formData, departments: selected })}
                  placeholder="Chọn khoa/phòng (để trống nếu áp dụng cho tất cả)"
                />
                <small className="form-text">
                  {formData.departments?.length > 0
                    ? `Đã chọn ${formData.departments.length} khoa/phòng`
                    : "Không chọn sẽ áp dụng cho tất cả khoa/phòng"}
                </small>
              </div>

              <div className="form-group">
                <label>Mở đăng ký*</label>
                <input
                  type="datetime-local"
                  name="registration_open"
                  value={formData.registration_open}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Đóng đăng ký*</label>
                <input
                  type="datetime-local"
                  name="registration_close"
                  value={formData.registration_close}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Thời gian diễn ra*</label>
                <input
                  type="datetime-local"
                  name="course_datetime"
                  value={formData.course_datetime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa điểm tổ chức*</label>
                <input
                  type="text"
                  name="course_location"
                  value={formData.course_location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hình thức*</label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="form-group">
                <label>Điểm CME</label>
                <input
                  type="number"
                  name="cme_point"
                  value={formData.cme_point}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Trạng thái*</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="pending">Chờ duyệt</option>
                  <option value="open">Mở đăng ký</option>
                  <option value="closed">Đóng</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Huỷ</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                {editingId ? "Cập nhật" : "Tạo"} khóa học
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-cancel"
              >
                Huỷ bỏ
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="courses-table-container">
          <div className="table-header">
            <h3>Danh sách khóa học</h3>
            <div className="table-actions">
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                className="search-input"
                onChange={handleSearch}
              />
              <button className="btn-refresh" onClick={fetchCourses}>
                <i className="fas fa-sync-alt"></i> Làm mới
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="courses-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th style={{ minWidth: '200px' }}>Tên khóa học</th>
                  <th style={{ width: '150px' }}>Khoa áp dụng</th>
                  <th style={{ minWidth: '150px' }}>Thời gian mở</th>
                  <th style={{ minWidth: '150px' }}>Thời gian đóng</th>
                  <th style={{ minWidth: '150px' }}>Diễn ra</th>
                  <th style={{ minWidth: '150px' }}>Địa điểm</th>
                  <th style={{ width: '120px' }}>Hình thức</th>
                  <th style={{ width: '100px' }}>Điểm CME</th>
                  <th style={{ width: '140px' }}>Trạng thái</th>
                  <th style={{ width: '180px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? (
                  courses.map((course, index) => (
                    <tr key={course._id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="course-title">
                          <strong>{course.title}</strong>
                          {/* {course.description && (
                            <div className="course-description truncate">
                              {course.description.length > 50 
                                ? `${course.description.substring(0, 50)}...` 
                                : course.description}
                            </div>
                          )} */}
                        </div>
                      </td>
                      <td>
                        {departments.length > 0 && (
                          (!course.departments || course.departments.length === 0 || course.departments.length === departments.length) ? (
                            <span className="department-badge all">Toàn bệnh viện</span>
                          ) : (
                            course.departments.map(dept => (
                              <span key={dept._id || dept} className="department-badge">
                                {typeof dept === 'object' ? dept.name : dept}
                              </span>
                            ))
                          )
                        )}
                      </td>
                      <td>{formatDate(course.registration_open)}</td>
                      <td>{formatDate(course.registration_close)}</td>
                      <td>{formatDate(course.course_datetime)}</td>
                      <td>{course.course_location || "-"}</td>
                      <td>
                        <span className={`mode-badge ${course.mode}`}>
                          {course.mode === "online" ? "Trực tuyến" : "Trực tiếp"}
                        </span>
                      </td>
                      <td className="text-center">{course.cme_point || 0}</td>
                      <td>
                        <span className={`status-badge ${course.status}`}>
                          {course.status === "open" && "Mở đăng ký"}
                          {course.status === "pending" && "Chờ duyệt"}
                          {course.status === "closed" && "Đã đóng"}
                          {course.status === "completed" && "Hoàn thành"}
                          {course.status === "cancelled" && "Đã huỷ"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            title="Chỉnh sửa"
                            onClick={() => {
                              setFormData({
                                ...course,
                                // Chỉ format nếu giá trị không phải là chuỗi rỗng
                                registration_open: course.registration_open ? formatForDateTimeInput(course.registration_open) : "",
                                registration_close: course.registration_close ? formatForDateTimeInput(course.registration_close) : "",
                                course_datetime: course.course_datetime ? formatForDateTimeInput(course.course_datetime) : ""
                              });
                              setEditingId(course._id);
                              setShowForm(true);
                            }}
                          >
                            <i className="fas fa-edit"></i> Sửa
                          </button>
                          <button
                            className="btn-delete"
                            title="Xoá"
                            onClick={() => handleDelete(course._id)}
                          >
                            <i className="fas fa-trash"></i> Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-data">
                      <div className="text-center py-4">
                        <i className="fas fa-inbox fa-2x mb-2" style={{ color: '#cbd5e0' }}></i>
                        <p>Không có khóa học nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
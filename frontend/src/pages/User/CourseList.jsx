import React, { useEffect, useState } from "react";
import axios from "axios";

const getCourseStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Chờ tới thời gian mở đăng ký";
    case "open":
      return "Đăng ký";
    case "closed":
      return "Kết thúc đăng ký";
    case "completed":
      return "Khoá học đã diễn ra";
    case "cancelled":
      return "Khoá học đã hủy";
    default:
      return status;
  }
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy token từ localStorage hoặc context nếu có xác thực
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRegister = async (courseId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `/api/registrations`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Đăng ký thành công!");
    } catch (err) {
      alert("Đăng ký thất bại!");
    }
  };

  const now = new Date();
  const filteredCourses = courses.filter((course) => {
    if (course.status === "cancelled") return false;
    if (course.status === "complete") {
      const courseEnd = new Date(course.course_datetime);
      return (now - courseEnd) < 24 * 60 * 60 * 1000;
    }
    return true;
  });

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h2>Danh sách khoá học</h2>
      <ul>
        {filteredCourses.map((course) => (
          <li key={course._id}>
            <b>{course.title}</b> - {course.description} <br />
            <i>Trạng thái: {getCourseStatusLabel(course.status)}</i>
            {(course.status === "open" || course.status === "pending") && (
              <button
                onClick={() => handleRegister(course._id)}
                disabled={course.status !== "open"}
              >
                Đăng ký
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseList;
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CourseList.css";

const getCourseStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Chờ mở đăng ký";
    case "open":
      return "Mở đăng ký";
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

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false
  });
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredCourseIds, setRegisteredCourseIds] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Hàm lưu danh sách khóa học đã đăng ký vào localStorage
  const saveRegisteredCoursesToStorage = (courseIds) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.setItem(`registeredCourses_${userId}`, JSON.stringify(courseIds));
    }
  };

  // Hàm lấy danh sách khóa học đã đăng ký từ localStorage
  const getRegisteredCoursesFromStorage = () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      const stored = localStorage.getItem(`registeredCourses_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  // Khởi tạo registeredCourseIds từ localStorage ngay khi component mount
  useEffect(() => {
    const storedCourseIds = getRegisteredCoursesFromStorage();
    setRegisteredCourseIds(storedCourseIds);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);

  // Tải danh sách khóa học đã đăng ký từ server và đồng bộ với localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/api/courses/registrations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Đảm bảo lấy đúng course_id từ response
        const courseIds = res.data.map(registration => 
          registration.course_id || registration.courseId || registration._id
        );
        
        // Cập nhật state và localStorage
        setRegisteredCourseIds(courseIds);
        saveRegisteredCoursesToStorage(courseIds);
        
        console.log("Registered course IDs from server:", courseIds); // Debug log
      })
      .catch((err) => {
        console.error("Error fetching registrations:", err);
        // Nếu lỗi API, vẫn giữ dữ liệu từ localStorage
        const storedCourseIds = getRegisteredCoursesFromStorage();
        setRegisteredCourseIds(storedCourseIds);
      });
  }, []);

  const handleRegister = async (courseId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `http://localhost:5000/api/courses/registrations/${courseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật state và localStorage ngay lập tức
      const updatedCourseIds = [...registeredCourseIds, courseId];
      setRegisteredCourseIds(updatedCourseIds);
      saveRegisteredCoursesToStorage(updatedCourseIds);
      
      // Cập nhật lại courses để đảm bảo registered_users được cập nhật
      const updatedCourses = courses.map(course => {
        if (course._id === courseId) {
          const userId = localStorage.getItem("userId");
          return {
            ...course,
            registered_users: [...(course.registered_users || []), userId]
          };
        }
        return course;
      });
      setCourses(updatedCourses);
      
      // Hiển thị thông báo thành công
      setSuccessMessage("Đăng ký khóa học thành công!");
      setShowSuccessModal(true);
      
      // Tự động ẩn modal sau 3 giây
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessMessage("");
      }, 3000);
      
    } catch (err) {
      console.error("Registration error:", err);
      
      // Kiểm tra nếu user đã đăng ký rồi
      if (err.response?.status === 400 && err.response?.data?.message?.includes("đã đăng ký")) {
        // Cập nhật state và localStorage để hiển thị đúng trạng thái
        const updatedCourseIds = registeredCourseIds.includes(courseId) 
          ? registeredCourseIds 
          : [...registeredCourseIds, courseId];
        
        setRegisteredCourseIds(updatedCourseIds);
        saveRegisteredCoursesToStorage(updatedCourseIds);
        
        setSuccessMessage("Bạn đã đăng ký khóa học này rồi!");
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage("");
        }, 3000);
      } else {
        alert(
          err.response?.data?.message ||
          "Đăng ký thất bại! Có thể bạn đã đăng ký hoặc khoá học chưa mở đăng ký."
        );
      }
    }
  };

  const now = new Date();
  const filteredCourses = courses.filter((course) => {
    if (course.status === "cancelled") return false;
    if (course.status === "complete" || course.status === "completed") {
      const courseEnd = new Date(course.course_datetime);
      return (now - courseEnd) < 24 * 60 * 60 * 1000;
    }
    return true;
  });

  const renderDepartments = (courseDepartments) => {
    if (
      !courseDepartments ||
      courseDepartments.length === 0 ||
      (departments && courseDepartments.length === departments.length)
    ) {
      return "Toàn bệnh viện";
    }
    return courseDepartments.map(dep => dep.name).join(", ");
  };

  // Hàm kiểm tra user đã đăng ký khóa học chưa - ưu tiên localStorage
  const isUserRegistered = (course) => {
    const userId = localStorage.getItem("userId");
    
    // Kiểm tra trong state registeredCourseIds (đã được đồng bộ với localStorage)
    const isInRegisteredList = registeredCourseIds.includes(course._id);
    
    // Kiểm tra trong course.registered_users (backup)
    const isInCourseUsers = course.registered_users?.some((id) => 
      id.toString() === userId?.toString()
    );
    
    const result = isInRegisteredList || isInCourseUsers;
    console.log(`Course ${course.title} - User registered:`, result, {
      isInRegisteredList,
      isInCourseUsers,
      registeredCourseIds,
      courseId: course._id
    }); // Debug log
    
    return result;
  };

  // Hàm render nút đăng ký với logic theo yêu cầu
  const renderRegistrationButton = (course) => {
    const now = new Date();
    const open = new Date(course.registration_open);
    const close = new Date(course.registration_close);
    const courseDate = new Date(course.course_datetime);
    const isRegistered = isUserRegistered(course);

    // 1. Nếu khóa học đã completed thì không hiển thị nút
    if (course.status === "completed" || now >= courseDate) {
      return null;
    }

    // 2. Nếu user đã đăng ký → hiển thị "Bạn đã đăng ký thành công" (disabled) 
    // Ở mọi trạng thái và thời gian trừ completed
    if (isRegistered) {
      return (
        <button 
          className="course-register-btn registered-btn" 
          style={{
            background: "#28a745", 
            color: "white",
            cursor: "default",
            opacity: "0.8"
          }} 
          disabled
        >
          Bạn đã đăng ký thành công
        </button>
      );
    }

    // 3. Nếu pending hoặc chưa tới thời gian mở → "Sắp tới thời gian đăng ký" (disabled)
    if (course.status === "pending" || now < open) {
      return (
        <button className="course-register-btn" disabled>
          Sắp tới thời gian đăng ký
        </button>
      );
    }

    // 4. Nếu open và trong thời gian đăng ký → "Đăng ký" (có thể click)
    if (course.status === "open" && now >= open && now <= close) {
      return (
        <button
          onClick={() => handleRegister(course._id)}
          className="course-register-btn active-btn"
          style={{
            background: "#007bff",
            color: "white",
            cursor: "pointer"
          }}
        >
          Đăng ký
        </button>
      );
    }

    // 5. Nếu closed hoặc quá thời gian và chưa đăng ký → "Đã hết thời gian đăng ký" (disabled)
    if (course.status === "closed" || now > close) {
      return (
        <button className="course-register-btn" disabled>
          Đã hết thời gian đăng ký
        </button>
      );
    }

    return null;
  };

  if (loading) return <div className="text-center py-8">Đang tải...</div>;

  return (
    <div className="course-list-container">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#2563eb' }}>Danh sách khoá học</h2>
      <div className="course-grid">
        {filteredCourses.map((course) => {
          // Thêm dòng này để xác định có hiển thị thời gian đăng ký không
          const now = new Date();
          const registrationClose = new Date(course.registration_close);
          const courseDate = new Date(course.course_datetime);
          const showRegistrationTime = now <= courseDate; // Hiển thị thời gian đăng ký cho đến khi khóa học diễn ra

          return (
            <div key={course._id} className="course-card">
              <div className="course-title">
                <span role="img" aria-label="book">📚</span> {course.title}
              </div>
              <div className={`course-status-inline status-${course.status}`}>
                {getCourseStatusLabel(course.status)}
              </div>
              <div className="course-info">{course.description}</div>
              <div className="course-info time-row">
                <span className="course-label">
                  Thời gian diễn ra:
                </span>
                <span className="course-time-value">{formatDateTime(course.course_datetime)}</span>
              </div>
              <div className="course-info"><span className="course-label">Địa điểm:</span> {course.course_location}</div>
              <div className="course-info"><span className="course-label">Hình thức:</span> {course.mode === "online" ? "Online" : "Offline"}</div>
              <div className="course-info"><span className="course-label">Điểm CME:</span> {course.cme_point}</div>
              {showRegistrationTime && (
                <>
                  <div className="course-info time-row">
                    <span className="course-label">
                      <span role="img" aria-label="calendar">📅</span> Mở đăng ký:
                    </span>
                    <span className="course-time-value">{formatDateTime(course.registration_open)}</span>
                  </div>
                  <div className="course-info time-row">
                    <span className="course-label">
                      <span role="img" aria-label="calendar">📅</span> Đóng đăng ký:
                    </span>
                    <span className="course-time-value">{formatDateTime(course.registration_close)}</span>
                  </div>
                </>
              )}
              <div className="course-info">
                <span className="course-label">Khoa/phòng:</span>{" "}
                {renderDepartments(course.departments)}
              </div>
              {renderRegistrationButton(course)}
            </div>
          );
        })}
      </div>
      
      {/* Modal thông báo thành công được cải thiện */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-success">
            <div className="modal-content">
              <div className="success-icon">✅</div>
              <h3>{successMessage}</h3>
              <p>Thông báo sẽ tự động đóng sau 3 giây...</p>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage("");
                }}
                className="close-modal-btn"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
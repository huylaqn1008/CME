import React, { useEffect, useState } from "react";
import apiClient from "../../config/api";
import { useNavigate } from "react-router-dom";
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
    case "live":
      return "Đang diễn ra trực tiếp";
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
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  // FIX: Hàm lấy userId đúng cách
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("User from localStorage:", user);
        return user.id || user._id || null;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  };

  // Hàm lưu danh sách khóa học đã đăng ký vào localStorage
  const saveRegisteredCoursesToStorage = (courseIds) => {
    const userId = getUserId();
    if (userId) {
      localStorage.setItem(`registeredCourses_${userId}`, JSON.stringify(courseIds));
      console.log("Saved to localStorage:", courseIds);
    }
  };

  // Hàm lấy danh sách khóa học đã đăng ký từ localStorage
  const getRegisteredCoursesFromStorage = () => {
    const userId = getUserId();
    if (userId) {
      const stored = localStorage.getItem(`registeredCourses_${userId}`);
      const result = stored ? JSON.parse(stored) : [];
      console.log("Loaded from localStorage:", result);
      return result;
    }
    return [];
  };

  // Khởi tạo registeredCourseIds từ localStorage ngay khi component mount
  useEffect(() => {
    const storedCourseIds = getRegisteredCoursesFromStorage();
    setRegisteredCourseIds(storedCourseIds);
  }, []);

  useEffect(() => {
    apiClient
      .get("/api/courses")
      .then((res) => {
        setCourses(res.data);
        setLoading(false);
        
        // Debug: Log tất cả courses
        console.log("=== ALL COURSES ===");
        res.data.forEach(course => {
          console.log(`Course: "${course.title}" - ID: ${course._id} - Mode: ${course.mode}`);
        });
      })
      .catch((err) => {
        console.error("Error loading courses:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    apiClient
      .get("/api/departments")
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);

  // Tải danh sách khóa học đã đăng ký từ server và đồng bộ với localStorage
  useEffect(() => {
    console.log("=== FETCHING REGISTRATIONS ===");
    console.log("User ID:", getUserId());
    
    apiClient
      .get("/api/courses/registrations")
      .then((res) => {
        console.log("=== REGISTRATION API SUCCESS ===");
        console.log("Raw registration response:", res.data);
        console.log("Response status:", res.status);
        
        // FIX: Đảm bảo lấy đúng course_id từ response
        const courseIds = res.data.map(registration => {
          // Ưu tiên course_id, sau đó courseId, cuối cùng _id
          const id = registration.course_id || registration.courseId || registration._id;
          console.log("Extracting ID from registration:", {
            course_id: registration.course_id,
            courseId: registration.courseId,
            _id: registration._id,
            extracted: id
          });
          return id;
        });
        
        // Cập nhật state và localStorage
        setRegisteredCourseIds(courseIds);
        saveRegisteredCoursesToStorage(courseIds);
        
        console.log("Final registered course IDs:", courseIds);
      })
      .catch((err) => {
        console.error("=== REGISTRATION API ERROR ===");
        console.error("Error fetching registrations:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        
        // Nếu lỗi API, vẫn giữ dữ liệu từ localStorage
        const storedCourseIds = getRegisteredCoursesFromStorage();
        setRegisteredCourseIds(storedCourseIds);
      });
  }, []);

  const handleRegister = async (courseId) => {
    console.log("=== ATTEMPTING REGISTRATION ===");
    console.log("Course ID:", courseId);
    console.log("User ID:", getUserId());
    
    try {
      const response = await apiClient.post(
        `/api/courses/registrations/${courseId}`,
        {}
      );
      
      console.log("Registration success:", response.data);
      
      // Cập nhật state và localStorage ngay lập tức
      const updatedCourseIds = [...registeredCourseIds, courseId];
      setRegisteredCourseIds(updatedCourseIds);
      saveRegisteredCoursesToStorage(updatedCourseIds);
      
      // Cập nhật lại courses để đảm bảo registered_users được cập nhật
      const updatedCourses = courses.map(course => {
        if (course._id === courseId) {
          const userId = getUserId();
          return {
            ...course,
            registered_users: [...(course.registered_users || []), userId]
          };
        }
        return course;
      });
      setCourses(updatedCourses);
      
      // Hiển thị thông báo thành công và chuyển về home sau 5s
      setSuccessMessage("Đăng ký khóa học thành công!");
      setShowSuccessModal(true);
      setCountdown(5);
      
      // Countdown và chuyển về home
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowSuccessModal(false);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("=== REGISTRATION ERROR ===");
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
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

  const handleJoinVideoCall = (courseId) => {
    navigate(`/live-classroom/${courseId}`);
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
    const userId = getUserId();
    
    // Kiểm tra nếu userId null hoặc course._id null
    if (!userId || !course._id) {
      console.log(`Registration check failed - userId: ${userId}, courseId: ${course._id}`);
      return false;
    }
    
    // Kiểm tra trong state registeredCourseIds (đã được đồng bộ với localStorage)
    const isInRegisteredList = registeredCourseIds.includes(course._id);
    
    // Kiểm tra trong course.registered_users (backup)
    const isInCourseUsers = course.registered_users?.some((id) => {
      // Kiểm tra null/undefined trước khi gọi toString()
      if (!id || !userId) return false;
      return id.toString() === userId.toString();
    });
    
    const result = isInRegisteredList || isInCourseUsers;
    
    // Debug log cho tất cả khóa học online
    if (course.mode === 'online') {
      console.log(`=== DEBUG COURSE: ${course.title} ===`);
      console.log("Course ID:", course._id);
      console.log("User ID:", userId);
      console.log("Registered Course IDs:", registeredCourseIds);
      console.log("Is in registered list:", isInRegisteredList);
      console.log("Course registered users:", course.registered_users);
      console.log("Is in course users:", isInCourseUsers);
      console.log("Final result:", result);
      console.log("Course mode:", course.mode);
      console.log("Course datetime:", course.course_datetime);
    }
    
    return result;
  };

  // Hàm render nút tham gia video call - cải thiện logic
  const renderVideoCallButton = (course) => {
    // Debug log cho khóa học online
    if (course.mode === 'online') {
      console.log(`=== DEBUG VIDEO CALL BUTTON: ${course.title} ===`);
      console.log("Course mode:", course.mode);
      console.log("Is online:", course.mode === 'online');
    }
    
    // Chỉ hiển thị cho khóa học online
    if (course.mode !== 'online') {
      return null;
    }
    
    const isRegistered = isUserRegistered(course);
    
    if (course.mode === 'online') {
      console.log(`Is registered for ${course.title}:`, isRegistered);
    }
    
    // Chỉ hiển thị cho user đã đăng ký
    if (!isRegistered) {
      if (course.mode === 'online') {
        console.log(`Not registered for ${course.title}, no video call button`);
      }
      return null;
    }

    const now = new Date();
    const courseTime = new Date(course.course_datetime);
    const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000); // 1 tiếng trước
    const oneHourAfter = new Date(courseTime.getTime() + 60 * 60 * 1000); // 1 tiếng sau
    
    if (course.mode === 'online') {
      console.log(`Time check for ${course.title}:`);
      console.log("Current time:", now);
      console.log("Course time:", courseTime);
      console.log("One hour before:", oneHourBefore);
      console.log("One hour after:", oneHourAfter);
      console.log("Is live:", course.status === 'live' || course.is_live);
      console.log("In time range:", now >= oneHourBefore && now <= oneHourAfter);
    }
    
    // Nếu đang live
    if (course.status === 'live' || course.is_live) {
      return (
        <button
          onClick={() => handleJoinVideoCall(course._id)}
          className="video-call-btn live-active"
        >
          🔴 Tham gia Video Call
        </button>
      );
    }
    
    // Nếu trong khung thời gian có thể tham gia (1 tiếng trước đến 1 tiếng sau)
    if (now >= oneHourBefore && now <= oneHourAfter) {
      return (
        <button
          onClick={() => handleJoinVideoCall(course._id)}
          className="video-call-btn available"
        >
          📹 Tới Video Call
        </button>
      );
    }
    
    // Nếu chưa tới thời gian
    if (now < oneHourBefore) {
      const timeUntilAvailable = Math.ceil((oneHourBefore - now) / (1000 * 60)); // phút
      return (
        <button
          className="video-call-btn waiting"
          disabled
          title={`Video call sẽ khả dụng sau ${timeUntilAvailable} phút`}
        >
          ⏰ Video Call ({timeUntilAvailable}p)
        </button>
      );
    }

    // Nếu đã quá thời gian
    if (now > oneHourAfter) {
      return (
        <button
          className="video-call-btn expired"
          disabled
        >
          ⏹️ Video Call đã kết thúc
        </button>
      );
    }

    return null;
  };

  // Hàm render nút đăng ký với logic ban đầu
  const renderRegistrationButton = (course) => {
    const now = new Date();
    const open = new Date(course.registration_open);
    const close = new Date(course.registration_close);
    const courseDate = new Date(course.course_datetime);
    const isRegistered = isUserRegistered(course);

    // Nếu đang live thì ẩn nút đăng ký
    if (course.status === "live" || course.is_live) {
      return null;
    }

    // 1. Nếu khóa học đã completed thì không hiển thị nút
    if (course.status === "completed" || now >= courseDate) {
      return null;
    }

    // 2. Nếu user đã đăng ký → hiển thị "Bạn đã đăng ký thành công" (disabled) 
    // Ở mọi trạng thái và thời gian trừ completed và live
    if (isRegistered) {
      return (
        <button 
          className="course-register-btn registered-btn" 
          disabled
        >
          ✅ Đã đăng ký thành công
        </button>
      );
    }

    // 3. Nếu pending hoặc chưa tới thời gian mở → "Đăng ký" (disabled)
    if (course.status === "pending" || now < open) {
      return (
        <button className="course-register-btn pending-btn" disabled>
          📝 Đăng ký (Chưa mở)
        </button>
      );
    }

    // 4. Nếu open và trong thời gian đăng ký → "Đăng ký" (có thể click)
    if (course.status === "open" && now >= open && now <= close) {
      return (
        <button
          onClick={() => handleRegister(course._id)}
          className="course-register-btn active-btn"
        >
          📝 Đăng ký ngay
        </button>
      );
    }

    // 5. Nếu closed hoặc quá thời gian và chưa đăng ký → "Đã quá thời gian đăng ký" (disabled)
    if (course.status === "closed" || now > close) {
      return (
        <button className="course-register-btn expired-btn" disabled>
          ⏰ Hết hạn đăng ký
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
                {course.mode === 'online' && (
                  <span className="online-badge">
                    📹 Trực tuyến
                  </span>
                )}
              </div>
              <div className={`course-status-inline status-${course.status}`}>
                {getCourseStatusLabel(course.status)}
              </div>
              <div className="course-info">{course.description}</div>
              <div className="course-info time-row">
                <span className="course-label">
                  ⏰ Thời gian diễn ra:
                </span>
                <span className="course-time-value">{formatDateTime(course.course_datetime)}</span>
              </div>
              <div className="course-info">
                <span className="course-label">📍 Địa điểm:</span> {course.course_location}
              </div>
              <div className="course-info">
                <span className="course-label">💻 Hình thức:</span> {course.mode === "online" ? "Trực tuyến" : "Trực tiếp"}
              </div>
              <div className="course-info">
                <span className="course-label">🏆 Điểm CME:</span> {course.cme_point}
              </div>
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
                <span className="course-label">🏥 Khoa/phòng:</span>{" "}
                {renderDepartments(course.departments)}
              </div>
              
              {/* Buttons container */}
              <div className="course-buttons">
                {renderRegistrationButton(course)}
                {renderVideoCallButton(course)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modal thông báo thành công với countdown */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-success">
            <div className="modal-content">
              <div className="success-icon">✅</div>
              <h3>{successMessage}</h3>
              <p>Chuyển về trang chủ sau {countdown} giây...</p>
              <div className="countdown-bar">
                <div 
                  className="countdown-progress" 
                  style={{ 
                    width: `${(countdown / 5) * 100}%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/");
                }}
                className="close-modal-btn"
              >
                Về trang chủ ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
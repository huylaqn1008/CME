const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/AuthMiddleware");
const {
  getAllCourses,
  getAllCoursesForAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  registerCourse,
  getUserRegistrations,
  startLiveSession,
  endLiveSession,
  getLiveSessionInfo,
  checkVideoCallAvailability,
} = require("../controllers/CourseController");

// Bảo vệ tất cả routes bằng authMiddleware
router.get("/", authMiddleware, getAllCourses);
router.get("/admin", authMiddleware, getAllCoursesForAdmin);
router.post("/", authMiddleware, createCourse);
router.put("/:id", authMiddleware, updateCourse);
router.delete("/:id", authMiddleware, deleteCourse);

// Routes cho đăng ký khóa học
router.post("/registrations/:id", authMiddleware, registerCourse);
router.get("/registrations", authMiddleware, getUserRegistrations);

// Routes cho live sessions
router.post("/:id/start-live", authMiddleware, startLiveSession);
router.post("/:id/end-live", authMiddleware, endLiveSession);
router.get("/:id/live-info", authMiddleware, getLiveSessionInfo);
router.get("/:id/video-call-availability", authMiddleware, checkVideoCallAvailability);

module.exports = router;
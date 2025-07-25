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

module.exports = router;
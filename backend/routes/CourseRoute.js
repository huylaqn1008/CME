const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/AuthMiddleware");
const {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/CourseController");

// Bảo vệ tất cả routes bằng authMiddleware
router.get("/", authMiddleware, getAllCourses);
router.post("/", authMiddleware, createCourse);
router.put("/:id", authMiddleware, updateCourse);
router.delete("/:id", authMiddleware, deleteCourse);

module.exports = router;

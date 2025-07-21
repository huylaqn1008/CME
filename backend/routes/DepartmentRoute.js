const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/AuthMiddleware");

const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/DepartmentController");

// ✅ Bảo vệ tất cả routes bằng middleware xác thực
router.get("/", authMiddleware, getAllDepartments);
router.post("/", authMiddleware, createDepartment);
router.put("/:id", authMiddleware, updateDepartment);
router.delete("/:id", authMiddleware, deleteDepartment);

module.exports = router;

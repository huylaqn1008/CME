const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/AuthMiddleware");
const checkRole = require("../middleware/CheckRoleMiddleware");

const {
  getAllUsers,
  updateUserRole,
  toggleUserActiveStatus
} = require("../controllers/UserController");

// GET danh sách người dùng (trừ Super Admin)
router.get("/", authMiddleware, checkRole("superadmin"), getAllUsers);

// PATCH: Cập nhật vai trò người dùng
router.patch(
  "/:id/role",
  authMiddleware,
  checkRole("superadmin"),
  updateUserRole
);

// PATCH: Cập nhật tình trạng hoạt động của tài khoản
router.patch(
  "/:id/status",
  authMiddleware,
  checkRole("superadmin"),
  toggleUserActiveStatus
);

module.exports = router;

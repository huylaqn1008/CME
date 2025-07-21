const Role = require("../models/RoleModel");

// Lấy danh sách tất cả vai trò
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({}, "name");
    res.json(roles);
  } catch (err) {
    console.error("Lỗi khi lấy vai trò:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách vai trò" });
  }
};

module.exports = {
  getAllRoles,
};

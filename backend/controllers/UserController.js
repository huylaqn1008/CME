const User = require("../models/UserModel");
const Role = require("../models/RoleModel");

// Lấy danh sách người dùng (trừ Super Admin)
const getAllUsers = async (req, res) => {
  try {
    const superAdminRole = await Role.findOne({ name: /super admin/i });

    const users = await User.find({
      role_id: { $ne: superAdminRole?._id },
    }).populate("role_id department_id");

    res.json({
      users: users.map((user) => ({
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_id?.name,
        department: user.department_id?.name || "Chưa có",
        is_active: user.is_active,
      })),
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách user:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật vai trò người dùng
const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { new_role_name } = req.body;

    if (!new_role_name)
      return res.status(400).json({ message: "Thiếu tên vai trò mới" });

    const targetUser = await User.findById(userId).populate("role_id");
    if (!targetUser)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    if (targetUser.role_id?.name?.toLowerCase() === "super admin") {
      return res
        .status(403)
        .json({ message: "Không thể đổi vai trò của Super Admin" });
    }

    const newRole = await Role.findOne({
      name: { $regex: new RegExp("^" + new_role_name + "$", "i") },
    });

    if (!newRole)
      return res.status(404).json({ message: "Vai trò không hợp lệ" });

    targetUser.role_id = newRole._id;
    await targetUser.save();

    res.json({
      message: "Cập nhật vai trò thành công",
      user: {
        id: targetUser._id,
        name: targetUser.full_name,
        role: newRole.name,
      },
    });
  } catch (err) {
    console.error("Lỗi cập nhật vai trò:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Khóa hoặc mở lại tài khoản người dùng
const toggleUserActiveStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Vui lòng nhập lý do" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    const action = user.is_active ? "lock" : "unlock";

    user.is_active = !user.is_active;
    user.deactivation_reason = action === "lock" ? reason : "";

    if (!user.reason_history) {
      user.reason_history = [];
    }

    user.reason_history.push({
      action,
      reason,
      timestamp: new Date(),
    });

    await user.save();

    res.json({
      message: `Đã ${
        action === "lock" ? "khóa" : "mở lại"
      } tài khoản thành công`,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserActiveStatus,
};

const checkRole = (requiredRoleName) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const role = user.role_id;

      console.log("🔍 Role:", role);
      console.log("🔍 Role Name:", role?.name);

      if (!role || !role.name) {
        return res.status(403).json({ message: "Vai trò không tồn tại" });
      }

      // Chuẩn hóa role để so sánh không lỗi do dấu cách hoặc viết hoa
      const actualRole = role.name.replace(/\s+/g, "").toLowerCase(); // "Super Admin" → "superadmin"
      const expectedRole = requiredRoleName.replace(/\s+/g, "").toLowerCase();

      if (actualRole !== expectedRole) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập" });
      }

      next();
    } catch (err) {
      console.error("Lỗi kiểm tra quyền:", err);
      return res.status(500).json({ message: "Lỗi server khi kiểm tra quyền" });
    }
  };
};

module.exports = checkRole;

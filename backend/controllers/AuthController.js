const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Role = require("../models/RoleModel");
const Department = require("../models/DepartmentModel");

const register = async (req, res) => {
  try {
    const usersData = Array.isArray(req.body) ? req.body : [req.body]; // Cho phép mảng hoặc 1 object

    const createdUsers = [];

    for (const userData of usersData) {
      const { full_name, email, password, department_name } = userData;

      if (!full_name || !email || !password || !department_name) {
        // Nếu thiếu thông tin thì bỏ qua người này và tiếp tục
        console.warn("⚠️ Thiếu thông tin:", userData);
        continue;
      }

      if (!email.includes("@")) {
        console.warn("⚠️ Email không hợp lệ:", email);
        continue;
      }

      if (password.length < 6) {
        console.warn("⚠️ Mật khẩu quá ngắn:", email);
        continue;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.warn("⚠️ Email đã tồn tại:", email);
        continue;
      }

      const password_hash = await bcrypt.hash(password, 10);

      const role = await Role.findOne({ name: /learner/i });
      if (!role) {
        console.warn("⚠️ Không tìm thấy role learner");
        continue;
      }

      const department = await Department.findOne({ name: department_name });
      if (!department) {
        return res.status(400).json({ message: "Tên khoa không hợp lệ" });
      }

      const user = await User.create({
        full_name,
        email,
        password_hash,
        role_id: role._id,
        department_id: department._id,
        is_active: true,
      });

      createdUsers.push({
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: role.name,
        department: department.name,
      });
    }

    if (createdUsers.length === 0) {
      return res.status(400).json({ message: "Không tạo được người dùng nào" });
    }

    res.status(201).json({
      message:
        createdUsers.length === 1
          ? "Đăng ký thành công"
          : `Đăng ký thành công ${createdUsers.length} người dùng`,
      users: createdUsers,
    });
  } catch (err) {
    console.error("Đăng ký lỗi:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
    }

    const user = await User.findOne({ email }).populate(
      "role_id department_id"
    );

    console.log("🔥 user sau khi tìm:", user);

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (!user.is_active)
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: typeof user.role_id === "object" ? user.role_id.name : null,
        department:
          typeof user.department_id === "object"
            ? user.department_id.name
            : null,
      },
    });
  } catch (err) {
    console.error("Đăng nhập lỗi:", err); // In toàn bộ lỗi
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  register,
  login,
};

const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .populate('role_id', 'name')
      .populate('department_id', 'name');

    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    console.log("User authenticated:", {
      id: user._id,
      email: user.email,
      role: user.role_id?.name,
      department: user.department_id?.name
    });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ 
      message: "Token không hợp lệ",
      error: err.message 
    });
  }
};

module.exports = authMiddleware;

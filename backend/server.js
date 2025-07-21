// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
 
const connectDB = require("./config/db");
const authRoutes = require("./routes/AuthRoute");
const userRoutes = require("./routes/UserRoute");
const departmentRoutes = require("./routes/DepartmentRoute");
const roleRoutes = require("./routes/RoleRoute");
const courseRoutes = require("./routes/CourseRoute");

// Load biến môi trường từ .env
dotenv.config();

// Kết nối MongoDB
connectDB();

// Chạy cron để tự động đóng đăng ký
require("./middleware/Scheduler")

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Thay bằng domain frontend của bạn
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/courses", courseRoutes);

// Trang test
app.get("/", (req, res) => {
  res.send("🚀 CME Backend API is running...");
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

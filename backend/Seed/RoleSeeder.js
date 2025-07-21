// seed/roleSeeder.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Role = require("../models/Role");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const roles = [
      { name: "Super Admin", description: "Toàn quyền hệ thống" },
      { name: "Training Admin", description: "Quản lý CME, khóa học" },
      { name: "Lecturer", description: "Giảng viên các lớp học CME" },
      { name: "Learner", description: "Cán bộ y tế học CME" },
      { name: "Auditor", description: "Thanh tra, giám sát CME" },
    ];

    for (const role of roles) {
      const exists = await Role.findOne({ name: role.name });
      if (!exists) {
        await Role.create(role);
        console.log(`✅ Đã tạo role: ${role.name}`);
      } else {
        console.log(`⚠️ Role ${role.name} đã tồn tại`);
      }
    }

    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Lỗi khi seed role:", err.message);
  });

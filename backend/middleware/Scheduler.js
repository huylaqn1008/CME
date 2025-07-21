const cron = require("node-cron");
const Course = require("../models/CourseModel");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  // Chuyển từ pending → open nếu đến thời gian mở đăng ký
  const openCourses = await Course.updateMany(
    { registration_open: { $lte: now }, status: "pending" },
    { $set: { status: "open" } }
  );

  // Chuyển từ open → closed nếu hết thời gian đăng ký
  const closedCourses = await Course.updateMany(
    { registration_close: { $lt: now }, status: "open" },
    { $set: { status: "closed" } }
  );

  // Chuyển từ closed → completed nếu đã qua thời gian tổ chức
  const completedCourses = await Course.updateMany(
    { course_datetime: { $lt: now }, status: "closed" },
    { $set: { status: "completed" } }
  );

  if (openCourses.modifiedCount > 0) {
    console.log(`🟢 Mở ${openCourses.modifiedCount} khóa học đang chờ đến thời gian mở.`);
  }

  if (closedCourses.modifiedCount > 0) {
    console.log(`🔴 Đã đóng ${closedCourses.modifiedCount} khóa học quá hạn đăng ký.`);
  }

  if (completedCourses.modifiedCount > 0) {
    console.log(`✅ Đã hoàn thành ${completedCourses.modifiedCount} khóa học.`);
  }
});

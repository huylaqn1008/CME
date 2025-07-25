const cron = require("node-cron");
const Course = require("../models/CourseModel");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  const courses = await Course.find();

  courses.forEach((course) => {
    if (course.status === "cancelled") return;

    if (now < course.registration_open) {
      course.status = "pending";
    } else if (now >= course.registration_open && now < course.registration_close) {
      course.status = "open";
    } else if (now >= course.registration_close && now < course.course_datetime) {
      course.status = "closed";
    } else if (now >= course.course_datetime) {
      course.status = "completed";
    }
    course.save();
  });
});

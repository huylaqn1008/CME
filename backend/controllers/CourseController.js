const Course = require("../models/CourseModel");

// Lấy danh sách tất cả khóa học
const getAllCourses = async (req, res) => {
  try {
    const userDepartment = req.user.department_id; // Giả sử user có trường department_id

    let query = {};
    if (userDepartment) {
      query = {
        $or: [
          { departments: { $in: [userDepartment] } },
          { departments: { $size: 0 } }, // Các khóa học không giới hạn khoa
        ],
      };
    }

    const courses = await Course.find(query).populate("departments", "name");
    res.json(courses);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllCoursesForAdmin = async (req, res) => {
  try {
    const courses = await Course.find().populate("departments", "name");
    res.json(courses);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học (admin):", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo mới khóa học
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      registration_open,
      registration_close,
      schedule,
      departments,
      course_datetime,
      course_location,
      mode,
      cme_point,
      status,
    } = req.body;

    const newCourse = new Course({
      title,
      description,
      registration_open,
      registration_close,
      schedule,
      course_datetime,
      course_location,
      mode,
      cme_point,
      status,
      departments: departments || [],
      created_by: req.user._id,
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (err) {
    console.error("❌ Lỗi khi tạo khóa học:", err);
    res.status(500).json({ message: "Không thể tạo khóa học" });
  }
};

// Cập nhật khóa học
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Lỗi khi cập nhật khóa học:", err);
    res.status(500).json({ message: "Không thể cập nhật khóa học" });
  }
};

// Xoá khóa học
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Course.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khóa học để xoá" });
    }

    res.json({ message: "Đã xoá khóa học thành công" });
  } catch (err) {
    console.error("Lỗi khi xoá khóa học:", err);
    res.status(500).json({ message: "Không thể xoá khóa học" });
  }
};

// Đăng ký khóa học
const registerCourse = async (req, res) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khoá học" });

    if (course.registered_users.includes(userId)) {
      return res.status(400).json({ message: "Bạn đã đăng ký khoá học này" });
    }

    if (course.status !== "open") {
      return res.status(400).json({ message: "Khoá học chưa mở đăng ký" });
    }

    const now = new Date();
    if (now < course.registration_open || now > course.registration_close) {
      return res.status(400).json({ message: "Không nằm trong thời gian đăng ký" });
    }

    course.registered_users.push(userId);
    await course.save();

    res.json({ message: "Đăng ký thành công!" });
  } catch (err) {
    console.error("Lỗi đăng ký khoá học:", err);
    res.status(500).json({ message: "Lỗi server khi đăng ký khoá học" });
  }
};

// Lấy danh sách khóa học mà user đã đăng ký
const getUserRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm tất cả khóa học mà user đã đăng ký
    const registeredCourses = await Course.find({
      registered_users: { $in: [userId] }
    }).select('_id title status course_datetime');

    // Trả về danh sách với format phù hợp cho frontend
    const registrations = registeredCourses.map(course => ({
      course_id: course._id,
      courseId: course._id, // Backup field name
      _id: course._id, // Backup field name
      title: course.title,
      status: course.status,
      course_datetime: course.course_datetime
    }));

    res.json(registrations);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đăng ký:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đăng ký" });
  }
};

module.exports = {
  getAllCourses,
  getAllCoursesForAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  registerCourse,
  getUserRegistrations,
};
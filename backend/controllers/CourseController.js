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
          { departments: { $size: 0 } } // Các khóa học không giới hạn khoa
        ]
      };
    }

    const courses = await Course.find().populate("departments", "name");
    res.json(courses);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học:", err);
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

module.exports = {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};

const Department = require("../models/DepartmentModel");
const User = require("../models/UserModel");

// Lấy danh sách tất cả phòng/khoa
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({}, "name");
    res.json(departments);
  } catch (err) {
    console.error("Lỗi khi lấy khoa:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khoa" });
  }
};

// Thêm khoa/phòng mới
const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra tên đã tồn tại chưa
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Khoa đã tồn tại" });
    }

    const newDepartment = new Department({ name });
    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (err) {
    console.error("Lỗi khi thêm khoa:", err);
    res.status(500).json({ message: "Lỗi khi thêm khoa" });
  }
};

// Sửa tên khoa
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await Department.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy khoa" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Lỗi khi cập nhật khoa:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật khoa" });
  }
};

// Xoá khoa
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // ⚠️ Dùng đúng tên trường: department_id
    const usersUsingDepartment = await User.find({ department_id: id });

    if (usersUsingDepartment.length > 0) {
      return res.status(400).json({
        message: `Không thể xoá khoa này vì còn ${usersUsingDepartment.length} người dùng đang thuộc khoa này.`,
      });
    }

    const deleted = await Department.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy khoa để xoá" });
    }

    res.json({ message: "Đã xoá khoa thành công" });
  } catch (err) {
    console.error("Lỗi khi xoá khoa:", err);
    res.status(500).json({ message: "Lỗi khi xoá khoa" });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};

const Course = require("../models/CourseModel");
const { v4: uuidv4 } = require('uuid');

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
    
    // Thêm thông tin về khả năng tham gia video call
    const coursesWithVideoCallInfo = courses.map(course => {
      const now = new Date();
      const courseTime = new Date(course.course_datetime);
      const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000); // 1 tiếng trước
      
      return {
        ...course.toObject(),
        can_join_video_call: course.mode === 'online' && now >= oneHourBefore && now <= courseTime,
        video_call_available_at: course.mode === 'online' ? oneHourBefore : null
      };
    });
    
    res.json(coursesWithVideoCallInfo);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách khóa học:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllCoursesForAdmin = async (req, res) => {
  try {
    const courses = await Course.find().populate("departments", "name");
    
    // Thêm thông tin về khả năng tham gia video call cho admin
    const coursesWithVideoCallInfo = courses.map(course => {
      const now = new Date();
      const courseTime = new Date(course.course_datetime);
      const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000);
      
      return {
        ...course.toObject(),
        can_join_video_call: course.mode === 'online' && now >= oneHourBefore && now <= courseTime,
        video_call_available_at: course.mode === 'online' ? oneHourBefore : null
      };
    });
    
    res.json(coursesWithVideoCallInfo);
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
      instructor_id: req.user._id, // Set creator as default instructor
      meeting_room_id: mode === 'online' ? uuidv4() : null, // Chỉ tạo room ID cho khóa học online
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

    // Nếu chuyển sang online mode và chưa có meeting room ID, tạo mới
    if (updateData.mode === 'online' && !updateData.meeting_room_id) {
      updateData.meeting_room_id = uuidv4();
    }
    
    // Nếu chuyển sang offline mode, xóa meeting room ID
    if (updateData.mode === 'offline') {
      updateData.meeting_room_id = null;
      updateData.is_live = false;
      updateData.live_session_url = null;
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ message: "Không tìm thấy khoá học" });
    }

    res.json(updatedCourse);
  } catch (err) {
    console.error("Lỗi khi cập nhật khóa học:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật khóa học" });
  }
};

// Xóa khóa học
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Không tìm thấy khoá học" });
    }

    res.json({ message: "Xóa khoá học thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa khóa học:", err);
    res.status(500).json({ message: "Lỗi server khi xóa khóa học" });
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
    }).select('_id title status course_datetime mode meeting_room_id is_live');

    // Trả về danh sách với format phù hợp cho frontend
    const registrations = registeredCourses.map(course => {
      const now = new Date();
      const courseTime = new Date(course.course_datetime);
      const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000);
      
      return {
        course_id: course._id,
        courseId: course._id, // Backup field name
        _id: course._id, // Backup field name
        title: course.title,
        status: course.status,
        course_datetime: course.course_datetime,
        mode: course.mode,
        meeting_room_id: course.meeting_room_id,
        is_live: course.is_live,
        can_join_video_call: course.mode === 'online' && now >= oneHourBefore && now <= courseTime,
        video_call_available_at: course.mode === 'online' ? oneHourBefore : null
      };
    });

    res.json(registrations);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách đăng ký:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đăng ký" });
  }
};

// Start live session - Chỉ cho phép trong khung thời gian 1 tiếng trước khóa học
const startLiveSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra quyền
    const isInstructor = course.created_by.toString() === userId.toString();
    const isSuperAdmin = req.user.role_id.name.toLowerCase().includes('super admin');

    if (!isInstructor && !isSuperAdmin) {
      return res.status(403).json({ message: "Chỉ giảng viên mới có thể bắt đầu buổi học trực tiếp" });
    }

    // Kiểm tra khóa học phải là online
    if (course.mode !== 'online') {
      return res.status(400).json({ message: "Chỉ khóa học trực tuyến mới có thể bắt đầu live session" });
    }

    // Kiểm tra thời gian - chỉ cho phép bắt đầu trước 1 tiếng và trong thời gian khóa học
    const now = new Date();
    const courseTime = new Date(course.course_datetime);
    const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000);
    
    if (now < oneHourBefore) {
      const timeUntilAvailable = Math.ceil((oneHourBefore - now) / (1000 * 60)); // phút
      return res.status(400).json({ 
        message: `Buổi học chỉ có thể bắt đầu từ ${oneHourBefore.toLocaleString('vi-VN')} (còn ${timeUntilAvailable} phút)` 
      });
    }
    
    if (now > courseTime) {
      return res.status(400).json({ message: "Đã quá thời gian diễn ra khóa học" });
    }

    if (course.is_live) {
      return res.status(400).json({ message: "Buổi học đã đang diễn ra" });
    }

    // Update course status
    course.is_live = true;
    course.live_started_at = new Date();
    course.status = 'live';
    course.live_session_url = `/live-classroom/${id}`;

    await course.save();

    res.json({
      message: "Bắt đầu buổi học trực tiếp thành công",
      live_session_url: course.live_session_url,
      meeting_room_id: course.meeting_room_id,
      course_title: course.title
    });
  } catch (err) {
    console.error("Lỗi khi bắt đầu live session:", err);
    res.status(500).json({ message: "Lỗi server khi bắt đầu buổi học trực tiếp" });
  }
};

// End live session
const endLiveSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra quyền
    const isInstructor = course.created_by.toString() === userId.toString();
    const isSuperAdmin = req.user.role_id.name.toLowerCase().includes('super admin');

    if (!isInstructor && !isSuperAdmin) {
      return res.status(403).json({ message: "Chỉ giảng viên mới có thể kết thúc buổi học trực tiếp" });
    }

    if (!course.is_live) {
      return res.status(400).json({ message: "Buổi học không đang diễn ra" });
    }

    // Update course status
    course.is_live = false;
    course.live_ended_at = new Date();
    course.status = 'completed';

    await course.save();

    res.json({ message: "Kết thúc buổi học trực tiếp thành công" });
  } catch (err) {
    console.error("Lỗi khi kết thúc live session:", err);
    res.status(500).json({ message: "Lỗi server khi kết thúc buổi học trực tiếp" });
  }
};

// Get course live session info
const getLiveSessionInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(id)
      .populate('created_by', 'full_name email')
      .populate('registered_users', 'full_name email');

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra quyền truy cập
    const isRegistered = course.registered_users.some(user => user._id.toString() === userId.toString());
    const isInstructor = course.created_by._id.toString() === userId.toString();
    const isSuperAdmin = req.user.role_id.name.toLowerCase().includes('super admin');

    if (!isRegistered && !isInstructor && !isSuperAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập khóa học này" });
    }

    // Kiểm tra khóa học có phải online không
    if (course.mode !== 'online') {
      return res.status(400).json({ message: "Khóa học này không hỗ trợ video call" });
    }

    // Kiểm tra thời gian
    const now = new Date();
    const courseTime = new Date(course.course_datetime);
    const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000);
    
    const canJoinVideoCall = now >= oneHourBefore && now <= courseTime;

    res.json({
      courseId: course._id,
      title: course.title,
      description: course.description,
      instructor: course.created_by,
      is_live: course.is_live,
      live_started_at: course.live_started_at,
      live_ended_at: course.live_ended_at,
      meeting_room_id: course.meeting_room_id,
      live_session_url: course.live_session_url,
      registered_users: course.registered_users,
      user_role: isInstructor || isSuperAdmin ? 'instructor' : 'student',
      course_datetime: course.course_datetime,
      can_join_video_call: canJoinVideoCall,
      video_call_available_at: oneHourBefore,
      time_until_available: canJoinVideoCall ? 0 : Math.max(0, Math.ceil((oneHourBefore - now) / (1000 * 60)))
    });
  } catch (err) {
    console.error("Lỗi khi lấy thông tin live session:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin buổi học trực tiếp" });
  }
};

// Check if video call is available for a course
const checkVideoCallAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra quyền truy cập
    const isRegistered = course.registered_users.includes(userId);
    const isInstructor = course.created_by.toString() === userId.toString();
    const isSuperAdmin = req.user.role_id.name.toLowerCase().includes('super admin');

    if (!isRegistered && !isInstructor && !isSuperAdmin) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập khóa học này" });
    }

    const now = new Date();
    const courseTime = new Date(course.course_datetime);
    const oneHourBefore = new Date(courseTime.getTime() - 60 * 60 * 1000);
    
    const canJoinVideoCall = course.mode === 'online' && now >= oneHourBefore && now <= courseTime;
    const timeUntilAvailable = canJoinVideoCall ? 0 : Math.max(0, Math.ceil((oneHourBefore - now) / (1000 * 60)));

    res.json({
      can_join_video_call: canJoinVideoCall,
      is_online_course: course.mode === 'online',
      is_live: course.is_live,
      video_call_available_at: course.mode === 'online' ? oneHourBefore : null,
      time_until_available: timeUntilAvailable,
      course_datetime: course.course_datetime,
      meeting_room_id: course.meeting_room_id
    });
  } catch (err) {
    console.error("Lỗi khi kiểm tra video call availability:", err);
    res.status(500).json({ message: "Lỗi server" });
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
  startLiveSession,
  endLiveSession,
  getLiveSessionInfo,
  checkVideoCallAvailability,
};
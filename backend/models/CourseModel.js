const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: String,

  departments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
  ],

  // Thời gian mở và đóng đăng ký
  registration_open: { type: Date, required: true },
  registration_close: { type: Date, required: true },

  // Lịch học cụ thể
  course_datetime: { type: Date, required: true }, // ví dụ: 2025-07-15T09:00
  course_location: { type: String, required: true }, // ví dụ: Hội trường A

  mode: { type: String, enum: ["online", "offline"], required: true },
  cme_point: { type: Number, default: 0 },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "open", "closed", "completed", "cancelled"],
    default: "pending",
  },
  registered_users: [{ type: Schema.Types.ObjectId, ref: "User" }],

  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", courseSchema);

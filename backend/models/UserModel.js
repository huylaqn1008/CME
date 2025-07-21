const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role_id: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  department_id: {
    type: Schema.Types.ObjectId,
    ref: "Department",
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  deactivation_reason: {
    type: String, // Lưu lý do Super Admin khóa
    default: "",
  },
  reason_history: [
    {
      action: {
        type: String,
        enum: ["lock", "unlock"],
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);

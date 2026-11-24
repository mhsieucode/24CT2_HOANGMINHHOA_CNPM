const mongoose = require("mongoose");

// =========================
// MODEL TÀI KHOẢN
// =========================

const userSchema = new mongoose.Schema(
  {
    hoTen: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    matKhau: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "staff", "admin"],
      default: "customer",
    },

    // Phiên bản token để thu hồi phiên đăng nhập
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// XUẤT MODEL
// =========================

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

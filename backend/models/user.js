const mongoose = require("mongoose");

// ======================================================
// MODEL TÀI KHOẢN MH MOTO
// ======================================================

const userSchema = new mongoose.Schema(
  {
    // ======================================
    // 1. HỌ VÀ TÊN
    // ======================================

    hoTen: {
      type: String,
      required: [true, "Vui lòng nhập họ tên!"],
      trim: true,
      minlength: [2, "Họ tên phải có ít nhất 2 ký tự!"],
      maxlength: [100, "Họ tên không được vượt quá 100 ký tự!"],
    },

    // ======================================
    // 2. EMAIL ĐĂNG NHẬP
    // ======================================

    email: {
      type: String,
      required: [true, "Vui lòng nhập email!"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email quá dài!"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email không đúng định dạng!"],
    },

    // ======================================
    // 3. MẬT KHẨU
    // ======================================

    matKhau: {
      type: String,
      required: [true, "Mật khẩu không được để trống!"],
      select: true,
    },

    // ======================================
    // 4. PHÂN QUYỀN TÀI KHOẢN
    // ======================================

    role: {
      type: String,
      enum: {
        values: ["customer", "staff", "admin"],
        message: "Vai trò tài khoản không hợp lệ!",
      },
      default: "customer",
      required: true,
    },

    // ======================================
    // 5. QUẢN LÝ PHIÊN ĐĂNG NHẬP
    // ======================================

    tokenVersion: {
      type: Number,
      default: 0,
      min: [0, "Token version không được âm!"],
      validate: {
        validator: Number.isSafeInteger,
        message: "Token version phải là số nguyên hợp lệ!",
      },
    },
  },
  {
    timestamps: true,

    // Chỉ lưu các trường được khai báo trong Schema
    strict: true,

    // Không để lộ thông tin nhạy cảm khi chuyển sang JSON
    toJSON: {
      transform: function (doc, ret) {
        delete ret.matKhau;
        delete ret.tokenVersion;
        delete ret.__v;

        return ret;
      },
    },
  }
);

// ======================================================
// 6. INDEX EMAIL
// ======================================================

// ======================================================
// 7. XUẤT MODEL
// ======================================================

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

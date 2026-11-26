const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

// ======================================================
// 1. KIỂM TRA ĐĂNG NHẬP BẰNG JWT COOKIE
// ======================================================

const kiemTraTaiKhoan = async (req, res, next) => {
  try {
    // Kiểm tra cấu hình JWT
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("THIẾU JWT_SECRET TRONG FILE .ENV");

      return res.status(500).json({
        success: false,
        message: "Máy chủ chưa cấu hình JWT_SECRET!",
      });
    }

    // Lấy JWT từ cookie
    const token = req.cookies?.mh_moto_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập!",
      });
    }

    // Xác thực JWT
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    // Kiểm tra dữ liệu trong token
    if (
      !decoded ||
      typeof decoded.sub !== "string" ||
      !mongoose.Types.ObjectId.isValid(decoded.sub)
    ) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ!",
      });
    }

    // Lấy tài khoản từ MongoDB
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại!",
      });
    }

    // Kiểm tra phiên đăng nhập
    const tokenVersion = Number(decoded.ver ?? 0);
    const currentVersion = Number(user.tokenVersion ?? 0);

    if (
      !Number.isSafeInteger(tokenVersion) ||
      !Number.isSafeInteger(currentVersion) ||
      tokenVersion < 0 ||
      currentVersion < 0 ||
      tokenVersion !== currentVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn!",
      });
    }

    // Kiểm tra quyền tài khoản
    if (!["customer", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không có quyền truy cập!",
      });
    }

    // Gắn thông tin người dùng vào request
    req.user = user;

    return next();
  } catch (error) {
    // Token sai, hết hạn hoặc không hợp lệ
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!",
      });
    }

    // Lỗi hệ thống hoặc MongoDB
    console.error("LỖI KIỂM TRA TÀI KHOẢN:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xác thực tài khoản!",
    });
  }
};

// ======================================================
// 2. CHỈ ADMIN ĐƯỢC QUẢN TRỊ HỆ THỐNG
// ======================================================

const kiemTraAdmin = [
  kiemTraTaiKhoan,

  (req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin mới được thực hiện chức năng này!",
      });
    }

    return next();
  },
];

// ======================================================
// 3. ADMIN VÀ NHÂN VIÊN ĐƯỢC QUẢN LÝ NGHIỆP VỤ
// ======================================================

const kiemTraQuanLy = [
  kiemTraTaiKhoan,

  (req, res, next) => {
    if (!["admin", "staff"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện nghiệp vụ quản lý!",
      });
    }

    return next();
  },
];

// ======================================================
// 4. XUẤT MIDDLEWARE
// ======================================================

module.exports = {
  kiemTraTaiKhoan,
  kiemTraAdmin,
  kiemTraQuanLy,
};

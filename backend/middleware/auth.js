
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// ======================================
// 1. KIỂM TRA ĐĂNG NHẬP JWT COOKIE
// ======================================

const kiemTraTaiKhoan = async (req, res, next) => {
  try {
    // Lấy JWT từ cookie
    const token = req.cookies?.mh_moto_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập!",
      });
    }

    // Kiểm tra cấu hình JWT
    if (!process.env.JWT_SECRET) {
      console.error("THIẾU JWT_SECRET TRONG FILE .ENV");

      return res.status(500).json({
        success: false,
        message: "Máy chủ chưa cấu hình JWT_SECRET!",
      });
    }

    // Xác thực JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sub) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ!",
      });
    }

    // Tìm tài khoản trong MongoDB
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại!",
      });
    }

    // Kiểm tra phiên đăng nhập
    if (
      Number(user.tokenVersion || 0) !==
      Number(decoded.ver || 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã hết hạn!",
      });
    }

    // Gắn tài khoản vào request
    req.user = user;

    next();
  } catch (error) {
    console.error("LỖI KIỂM TRA JWT:", error.message);

    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!",
    });
  }
};

// ======================================
// 2. CHỈ ADMIN ĐƯỢC QUẢN TRỊ HỆ THỐNG
// ======================================

const kiemTraAdmin = [
  kiemTraTaiKhoan,

  (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ Admin mới được thực hiện chức năng này!",
      });
    }

    next();
  },
];

// ======================================
// 3. ADMIN VÀ NHÂN VIÊN ĐƯỢC QUẢN LÝ NGHIỆP VỤ
// ======================================

const kiemTraQuanLy = [
  kiemTraTaiKhoan,

  (req, res, next) => {
    if (!req.user || !["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện nghiệp vụ quản lý!",
      });
    }

    next();
  },
];

// ======================================
// 4. XUẤT MIDDLEWARE
// ======================================

module.exports = {
  kiemTraTaiKhoan,
  kiemTraAdmin,
  kiemTraQuanLy,
};

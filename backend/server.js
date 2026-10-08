const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// MONGODB
// =========================

const MONGO_URI = process.env.MONGO_URI;

console.log("Đang kết nối MongoDB...");
console.log("MONGO_URI đã được đọc:", !!MONGO_URI);

// =========================
// MODEL USER
// =========================

const userSchema = new mongoose.Schema(
  {
    hoTen: {
      type: String,
      required: true,
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
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

// =========================
// ĐĂNG KÝ
// =========================

app.post("/api/dang-ky", async (req, res) => {
  try {
    const { hoTen, email, matKhau } = req.body;

    if (!hoTen || !email || !matKhau) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
    }

    const emailChuanHoa = email.toLowerCase().trim();

    // Kiểm tra email đã tồn tại
    const userTonTai = await User.findOne({
      email: emailChuanHoa,
    });

    if (userTonTai) {
      return res.status(400).json({
        message: "Email này đã được đăng ký!",
      });
    }

    // Mã hóa mật khẩu
    const matKhauMaHoa = await bcrypt.hash(matKhau, 10);

    // Tạo user
    const user = new User({
      hoTen: hoTen.trim(),
      email: emailChuanHoa,
      matKhau: matKhauMaHoa,
    });

    await user.save();

    return res.status(201).json({
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);

    return res.status(500).json({
      message: "Lỗi server!",
    });
  }
});

// =========================
// ĐĂNG NHẬP
// =========================

app.post("/api/dang-nhap", async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (!email || !matKhau) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu!",
      });
    }

    const emailChuanHoa = email.toLowerCase().trim();

    // Tìm user
    const user = await User.findOne({
      email: emailChuanHoa,
    });

    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    // Kiểm tra mật khẩu
    const dungMatKhau = await bcrypt.compare(matKhau, user.matKhau);

    if (!dungMatKhau) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    return res.json({
      message: "Đăng nhập thành công!",

      user: {
        id: user._id,
        hoTen: user.hoTen,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);

    return res.status(500).json({
      message: "Lỗi server!",
    });
  }
});

// =========================
// ADMIN - LẤY DANH SÁCH TÀI KHOẢN
// =========================

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find().select("-matKhau").sort({ createdAt: -1 });

    return res.json({
      users: users,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách tài khoản:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách tài khoản!",
    });
  }
});

// =========================
// ADMIN - ĐỔI QUYỀN TÀI KHOẢN
// =========================

app.put("/api/admin/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Quyền không hợp lệ!",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản!",
      });
    }

    user.role = role;

    await user.save();

    return res.json({
      message: "Cập nhật quyền thành công!",
      user: {
        id: user._id,
        hoTen: user.hoTen,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đổi quyền:", error);

    return res.status(500).json({
      message: "Không thể cập nhật quyền!",
    });
  }
});

// =========================
// ADMIN - XÓA TÀI KHOẢN
// =========================

app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản!",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Xóa tài khoản thành công!",
    });
  } catch (error) {
    console.error("Lỗi xóa tài khoản:", error);

    return res.status(500).json({
      message: "Không thể xóa tài khoản!",
    });
  }
});

// =========================
// TEST SERVER
// =========================

app.get("/", (req, res) => {
  res.send("MOTO SHOP API đang chạy!");
});

// =========================
// KẾT NỐI DATABASE RỒI MỚI CHẠY SERVER
// =========================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("=================================");
    console.log("MONGODB KẾT NỐI THÀNH CÔNG!");
    console.log("=================================");

    app.listen(5000, () => {
      console.log("Server đang chạy tại http://localhost:5000");
    });
  })
  .catch((error) => {
    console.log("=================================");
    console.log("KẾT NỐI MONGODB THẤT BẠI");
    console.log("=================================");
    console.log(error.message);
  });

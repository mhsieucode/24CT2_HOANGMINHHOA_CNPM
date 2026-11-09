const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const path = require("path");

const productRoutes = require("./routes/productRoutes");

require("dotenv").config();

dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// CẤU HÌNH SERVER
// =========================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Cho phép frontend xem ảnh đã upload
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API sản phẩm
app.use("/api/products", productRoutes);

// =========================
// MODEL USER
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
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// =========================
// KIỂM TRA ADMIN
// =========================

async function kiemTraAdmin(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập!",
      });
    }

    const admin = await User.findById(userId);

    if (!admin) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại!",
      });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền admin!",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Lỗi kiểm tra quyền admin:", error);

    return res.status(500).json({
      message: "Lỗi kiểm tra quyền admin!",
    });
  }
}

// =========================
// TRANG CHỦ API
// =========================

app.get("/", (req, res) => {
  res.send("MOTO SHOP API đang hoạt động!");
});

// =========================
// KIỂM TRA SERVER
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    message: "Server hoạt động bình thường!",
    mongodb:
      mongoose.connection.readyState === 1 ? "Đã kết nối" : "Chưa kết nối",
  });
});

// =========================
// ĐĂNG KÝ
// =========================

app.post("/api/dang-ky", async (req, res) => {
  try {
    const { hoTen, email, matKhau } = req.body;

    if (
      typeof hoTen !== "string" ||
      typeof email !== "string" ||
      typeof matKhau !== "string" ||
      !hoTen.trim() ||
      !email.trim() ||
      !matKhau
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin!",
      });
    }

    const emailChuanHoa = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailChuanHoa)) {
      return res.status(400).json({
        message: "Email không đúng định dạng!",
      });
    }

    if (matKhau.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự!",
      });
    }

    const userTonTai = await User.findOne({
      email: emailChuanHoa,
    });

    if (userTonTai) {
      return res.status(409).json({
        message: "Email này đã được đăng ký!",
      });
    }

    const matKhauMaHoa = await bcrypt.hash(matKhau, 10);

    const user = await User.create({
      hoTen: hoTen.trim(),
      email: emailChuanHoa,
      matKhau: matKhauMaHoa,
      role: "customer",
    });

    return res.status(201).json({
      message: "Đăng ký thành công!",
      user: {
        id: user._id,
        _id: user._id,
        hoTen: user.hoTen,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email này đã được đăng ký!",
      });
    }

    return res.status(500).json({
      message: "Lỗi server khi đăng ký!",
    });
  }
});

// =========================
// ĐĂNG NHẬP
// =========================

app.post("/api/dang-nhap", async (req, res) => {
  try {
    const { email, matKhau } = req.body;

    if (
      typeof email !== "string" ||
      typeof matKhau !== "string" ||
      !email.trim() ||
      !matKhau
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập email và mật khẩu!",
      });
    }

    const emailChuanHoa = email.toLowerCase().trim();

    const user = await User.findOne({
      email: emailChuanHoa,
    });

    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    const dungMatKhau = await bcrypt.compare(matKhau, user.matKhau);

    if (!dungMatKhau) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác!",
      });
    }

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      user: {
        id: user._id,
        _id: user._id,
        hoTen: user.hoTen,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);

    return res.status(500).json({
      message: "Lỗi server khi đăng nhập!",
    });
  }
});

// =========================
// ADMIN - DANH SÁCH TÀI KHOẢN
// =========================

app.get("/api/admin/users", kiemTraAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-matKhau").sort({ createdAt: -1 });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách tài khoản:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách tài khoản!",
    });
  }
});

// =========================
// ADMIN - ĐỔI QUYỀN
// =========================

app.put("/api/admin/users/:id/role", kiemTraAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const id = req.params.id;

    if (!["customer", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Quyền không hợp lệ!",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID tài khoản không hợp lệ!",
      });
    }

    if (String(req.admin._id) === String(id) && role !== "admin") {
      return res.status(403).json({
        message: "Bạn không thể tự hạ quyền admin!",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản!",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Đổi quyền thành công!",
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

app.delete("/api/admin/users/:id", kiemTraAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID tài khoản không hợp lệ!",
      });
    }

    if (String(req.admin._id) === String(id)) {
      return res.status(403).json({
        message: "Bạn không thể tự xóa tài khoản đang đăng nhập!",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản!",
      });
    }

    return res.status(200).json({
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
// API KHÔNG TỒN TẠI
// =========================

app.use((req, res) => {
  res.status(404).json({
    message: "Không tìm thấy API yêu cầu!",
  });
});

// =========================
// XỬ LÝ LỖI SERVER
// =========================

app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);

  res.status(err.status || 500).json({
    message: err.message || "Đã xảy ra lỗi server!",
  });
});

// =========================
// KHỞI ĐỘNG SERVER
// =========================

async function startServer() {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("Không tìm thấy MONGO_URI trong file .env!");
    }

    await mongoose.connect(MONGO_URI);

    console.log("=================================");
    console.log("MONGODB KẾT NỐI THÀNH CÔNG!");
    console.log("=================================");

    app.listen(PORT, () => {
      console.log(`SERVER: http://localhost:${PORT}`);
      console.log(`HEALTH: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("=================================");
    console.error("KHỞI ĐỘNG SERVER THẤT BẠI!");
    console.error(error.message);
    console.error("=================================");

    process.exit(1);
  }
}

startServer();

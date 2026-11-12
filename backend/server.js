// ======================================
// IMPORT THƯ VIỆN
// ======================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const path = require("path");

require("dotenv").config();

dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 5000;

// ======================================
// IMPORT MODEL VÀ ROUTE
// ======================================

const User = require("./models/User");
const Product = require("./models/product");
const Cart = require("./models/cart");
const Order = require("./models/order");
const productRoutes = require("./routes/productRoutes");

// ======================================
// CẤU HÌNH SERVER
// ======================================

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/products", productRoutes);

// ======================================
// KIỂM TRA TÀI KHOẢN
// ======================================

async function kiemTraTaiKhoan(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập!",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại!",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Lỗi kiểm tra tài khoản:", error);

    return res.status(500).json({
      message: "Lỗi kiểm tra tài khoản!",
    });
  }
}

// ======================================
// KIỂM TRA ADMIN
// ======================================

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

// ======================================
// TRANG CHỦ API
// ======================================

app.get("/", (req, res) => {
  res.send("MH MOTO API đang hoạt động!");
});

// ======================================
// KIỂM TRA SERVER
// ======================================

app.get("/api/health", (req, res) => {
  res.json({
    message: "Server hoạt động bình thường!",
    mongodb:
      mongoose.connection.readyState === 1 ? "Đã kết nối" : "Chưa kết nối",
  });
});

// ======================================
// ĐĂNG KÝ
// ======================================

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

// ======================================
// ĐĂNG NHẬP
// ======================================

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

// ======================================
// LẤY GIỎ HÀNG
// ======================================

app.get("/api/cart", kiemTraTaiKhoan, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    return res.status(200).json({
      message: "Lấy giỏ hàng thành công!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);

    return res.status(500).json({
      message: "Không thể lấy giỏ hàng!",
    });
  }
});

// ======================================
// THÊM SẢN PHẨM VÀO GIỎ
// ======================================

app.post("/api/cart/add", kiemTraTaiKhoan, async (req, res) => {
  try {
    const { productId, soLuong } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    const soLuongThem = Number(soLuong || 1);

    if (!Number.isInteger(soLuongThem) || soLuongThem < 1) {
      return res.status(400).json({
        message: "Số lượng sản phẩm không hợp lệ!",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    let cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: [],
      });
    }

    const item = cart.items.find(
      (item) => String(item.productId) === String(product._id)
    );

    const soLuongHienTai = item ? item.soLuong : 0;

    if (soLuongHienTai + soLuongThem > product.soLuong) {
      return res.status(400).json({
        message: "Số lượng sản phẩm trong kho không đủ!",
      });
    }

    if (item) {
      item.soLuong += soLuongThem;
    } else {
      cart.items.push({
        productId: product._id,
        tenSanPham: product.tenSanPham,
        hinhAnh: product.hinhAnh,
        gia: product.gia,
        soLuong: soLuongThem,
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Đã thêm sản phẩm vào giỏ hàng!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi thêm vào giỏ hàng:", error);

    return res.status(500).json({
      message: "Không thể thêm sản phẩm vào giỏ hàng!",
    });
  }
});

// ======================================
// CẬP NHẬT SỐ LƯỢNG GIỎ
// ======================================

app.put("/api/cart/:productId", kiemTraTaiKhoan, async (req, res) => {
  try {
    const { productId } = req.params;
    const soLuong = Number(req.body.soLuong);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    if (!Number.isInteger(soLuong) || soLuong < 1) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0!",
      });
    }

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại!",
      });
    }

    const item = cart.items.find(
      (item) => String(item.productId) === String(productId)
    );

    if (!item) {
      return res.status(404).json({
        message: "Sản phẩm không có trong giỏ hàng!",
      });
    }

    const product = await Product.findById(productId);

    if (!product || soLuong > product.soLuong) {
      return res.status(400).json({
        message: "Số lượng sản phẩm trong kho không đủ!",
      });
    }

    item.soLuong = soLuong;

    await cart.save();

    return res.status(200).json({
      message: "Cập nhật số lượng thành công!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi cập nhật giỏ hàng:", error);

    return res.status(500).json({
      message: "Không thể cập nhật giỏ hàng!",
    });
  }
});

// ======================================
// XÓA SẢN PHẨM KHỎI GIỎ
// ======================================

app.delete("/api/cart/:productId", kiemTraTaiKhoan, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại!",
      });
    }

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== String(productId)
    );

    await cart.save();

    return res.status(200).json({
      message: "Đã xóa sản phẩm khỏi giỏ hàng!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm:", error);

    return res.status(500).json({
      message: "Không thể xóa sản phẩm!",
    });
  }
});

// ======================================
// TẠO ĐƠN HÀNG
// ======================================

// ======================================
// TẠO ĐƠN HÀNG - LƯU ẢNH SẢN PHẨM
// ======================================

// ======================================
// TẠO ĐƠN HÀNG - LƯU ĐẦY ĐỦ ẢNH SẢN PHẨM
// ======================================

app.post("/api/orders", kiemTraTaiKhoan, async (req, res) => {
  try {
    const { hoTen, soDienThoai, diaChi, items, phuongThucThanhToan } = req.body;

    // KIỂM TRA THÔNG TIN KHÁCH HÀNG
    if (
      typeof hoTen !== "string" ||
      typeof soDienThoai !== "string" ||
      typeof diaChi !== "string" ||
      !hoTen.trim() ||
      !soDienThoai.trim() ||
      !diaChi.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin đặt hàng!",
      });
    }

    // KIỂM TRA PHƯƠNG THỨC THANH TOÁN
    if (!["COD", "BANK_TRANSFER"].includes(phuongThucThanhToan)) {
      return res.status(400).json({
        message: "Phương thức thanh toán không hợp lệ!",
      });
    }

    let tongTien = 0;
    const danhSachSanPham = [];

    // LẤY THÔNG TIN SẢN PHẨM TỪ DATABASE
    for (const sp of items) {
      const productId = String(sp.productId || sp._id || sp.id || "");

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          message: "ID sản phẩm không hợp lệ!",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          message: "Không tìm thấy sản phẩm!",
        });
      }

      const gia = Number(product.gia);
      const soLuong = Number(sp.soLuong || sp.quantity || 1);

      if (
        !Number.isFinite(gia) ||
        gia < 0 ||
        !Number.isInteger(soLuong) ||
        soLuong < 1
      ) {
        return res.status(400).json({
          message: "Giá hoặc số lượng sản phẩm không hợp lệ!",
        });
      }

      if (soLuong > product.soLuong) {
        return res.status(400).json({
          message: `Sản phẩm ${product.tenSanPham} không đủ hàng!`,
        });
      }

      tongTien += gia * soLuong;

      // LẤY ẢNH SẢN PHẨM TỪ DATABASE
      const hinhAnhSanPham = product.hinhAnh || "";

      console.log("=================================");
      console.log("SẢN PHẨM ĐẶT HÀNG:", product.tenSanPham);
      console.log("ẢNH SẢN PHẨM:", hinhAnhSanPham);
      console.log("=================================");

      danhSachSanPham.push({
        productId: product._id,
        tenSanPham: product.tenSanPham,
        hinhAnh: hinhAnhSanPham,
        gia: gia,
        soLuong: soLuong,
      });
    }

    // TẠO ĐƠN HÀNG
    const donHang = await Order.create({
      userId: req.user._id,
      hoTen: hoTen.trim(),
      soDienThoai: soDienThoai.trim(),
      diaChi: diaChi.trim(),
      items: danhSachSanPham,
      tongTien,
      phuongThucThanhToan,

      trangThaiThanhToan:
        phuongThucThanhToan === "COD"
          ? "Thanh toán khi nhận hàng"
          : "Chờ xác nhận chuyển khoản",

      trangThaiDonHang: "Chờ xác nhận",
    });

    return res.status(201).json({
      message: "Đặt hàng thành công!",
      order: donHang,
    });
  } catch (error) {
    console.error("LỖI TẠO ĐƠN HÀNG:", error);

    return res.status(500).json({
      message: "Không thể tạo đơn hàng!",
    });
  }
});
// ======================================
// LẤY ĐƠN HÀNG CỦA TÀI KHOẢN
// ======================================

app.get("/api/orders", kiemTraTaiKhoan, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);

    return res.status(500).json({
      message: "Không thể lấy đơn hàng!",
    });
  }
});

// ======================================
// ADMIN - DANH SÁCH TÀI KHOẢN
// ======================================

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

// ======================================
// ADMIN - ĐỔI QUYỀN TÀI KHOẢN
// ======================================

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

// ======================================
// ADMIN - XÓA TÀI KHOẢN
// ======================================

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

// ======================================
// ADMIN - LẤY DANH SÁCH ĐƠN HÀNG
// ======================================

app.get("/api/admin/orders", kiemTraAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách đơn hàng!",
    });
  }
});

// ======================================
// ADMIN - CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// ======================================

app.put("/api/admin/orders/:id/status", kiemTraAdmin, async (req, res) => {
  try {
    const { trangThaiDonHang } = req.body;

    const trangThaiHopLe = [
      "Chờ xác nhận",
      "Đã xác nhận",
      "Đang giao hàng",
      "Đã hoàn thành",
      "Đã hủy",
    ];

    if (!trangThaiHopLe.includes(trangThaiDonHang)) {
      return res.status(400).json({
        message: "Trạng thái đơn hàng không hợp lệ!",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "ID đơn hàng không hợp lệ!",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { trangThaiDonHang },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công!",
      order,
    });
  } catch (error) {
    console.error("Lỗi cập nhật đơn hàng:", error);

    return res.status(500).json({
      message: "Không thể cập nhật trạng thái đơn hàng!",
    });
  }
});

// ======================================
// API KHÔNG TỒN TẠI
// PHẢI ĐẶT SAU TẤT CẢ API
// ======================================

app.use((req, res) => {
  return res.status(404).json({
    message: "Không tìm thấy API yêu cầu!",
  });
});

// ======================================
// XỬ LÝ LỖI SERVER
// ======================================

app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);

  res.status(err.status || 500).json({
    message: err.message || "Đã xảy ra lỗi server!",
  });
});

// ======================================
// KHỞI ĐỘNG SERVER
// ======================================

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

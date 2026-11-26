// ======================================
// 1. IMPORT THƯ VIỆN
// ======================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const {
  kiemTraTaiKhoan,
  kiemTraAdmin,
  kiemTraQuanLy,
} = require("./middleware/auth");

require("dotenv").config();

dns.setDefaultResultOrder("ipv4first");

// ======================================
// 2. KHỞI TẠO SERVER
// ======================================
const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// ======================================
// 3. SOCKET.IO
// ======================================
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// ======================================
// 4. IMPORT MODEL VÀ ROUTE
// ======================================
const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");
const Order = require("./models/order");
const Message = require("./models/message");

const productRoutes = require("./routes/productRoutes");
const chatRoutes = require("./routes/chatRoutes");

// ======================================
// 5. CẤU HÌNH MIDDLEWARE
// ======================================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================================
// 6. KẾT NỐI ROUTE
// ======================================
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);

// ======================================
// 7. LIVE CHAT - SOCKET.IO XÁC THỰC JWT
// ======================================

function layTokenTuCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  const cookie = cookies.find((item) =>
    item.trim().startsWith("mh_moto_token=")
  );

  if (!cookie) return null;

  return decodeURIComponent(cookie.trim().substring("mh_moto_token=".length));
}

io.use(async (socket, next) => {
  try {
    const token = layTokenTuCookie(socket.handshake.headers.cookie);

    if (!token) {
      return next(new Error("Bạn cần đăng nhập để sử dụng Live Chat!"));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error("Máy chủ chưa cấu hình JWT_SECRET!"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sub) {
      return next(new Error("Phiên đăng nhập không hợp lệ!"));
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new Error("Tài khoản không tồn tại!"));
    }

    if (Number(user.tokenVersion || 0) !== Number(decoded.ver || 0)) {
      return next(new Error("Phiên đăng nhập đã hết hạn!"));
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error("Lỗi xác thực Socket.IO:", error.message);

    next(new Error("Không thể xác thực kết nối Live Chat!"));
  }
});

io.on("connection", (socket) => {
  const user = socket.user;

  console.log(`Socket kết nối: ${user.hoTen} - ${user.role} - ${socket.id}`);

  socket.on("chat:admin:join", () => {
    if (user.role !== "admin") return;

    socket.join("mh_moto_admin");

    console.log("Admin đã tham gia phòng Live Chat");
  });

  socket.on("chat:join", async (conversationId) => {
    try {
      if (
        typeof conversationId !== "string" ||
        !conversationId.trim() ||
        conversationId.length > 100
      ) {
        return;
      }

      if (user.role === "admin") {
        socket.join(conversationId);

        console.log("Admin tham gia phòng:", conversationId);

        return;
      }

      if (user.role !== "customer") return;

      const coQuyen = await Message.exists({
        conversationId,
        ownerId: user._id,
      });

      if (!coQuyen) {
        console.log("Từ chối tham gia phòng chat:", conversationId);

        return;
      }

      socket.join(conversationId);

      console.log("Khách hàng tham gia phòng:", conversationId);
    } catch (error) {
      console.error("Lỗi tham gia phòng chat:", error);
    }
  });

  socket.on("chat:send", () => {
    console.log("Từ chối yêu cầu broadcast trực tiếp từ client.");
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket ngắt kết nối: ${user.hoTen} - ${reason}`);
  });
});

// ======================================
// 8. API TRANG CHỦ
// ======================================
app.get("/", (req, res) => {
  res.send("MH MOTO API đang hoạt động!");
});

// ======================================
// 9. API KIỂM TRA SERVER
// ======================================
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server hoạt động bình thường!",
    mongodb:
      mongoose.connection.readyState === 1 ? "Đã kết nối" : "Chưa kết nối",
    socket: "Đã khởi tạo",
  });
});

// ======================================
// 10. ĐĂNG KÝ
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
// 11. ĐĂNG NHẬP
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

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Máy chủ chưa cấu hình JWT_SECRET!",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
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

    const token = jwt.sign(
      {
        sub: String(user._id),
        ver: Number(user.tokenVersion || 0),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("mh_moto_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
// 12. KIỂM TRA PHIÊN ĐĂNG NHẬP
// ======================================
app.get("/api/auth/me", kiemTraTaiKhoan, (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      _id: req.user._id,
      hoTen: req.user.hoTen,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ======================================
// 13. ĐĂNG XUẤT
// ======================================
app.post("/api/dang-xuat", async (req, res) => {
  try {
    const token = req.cookies?.mh_moto_token;

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.sub) {
          const user = await User.findById(decoded.sub);

          if (user) {
            user.tokenVersion = Number(user.tokenVersion || 0) + 1;

            await user.save();
          }
        }
      } catch (error) {
        // Token hết hạn hoặc không hợp lệ vẫn xóa cookie.
      }
    }

    res.clearCookie("mh_moto_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
    });
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể đăng xuất!",
    });
  }
});

// ======================================
// 14. LẤY GIỎ HÀNG
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
// 15. THÊM SẢN PHẨM VÀO GIỎ
// ======================================
app.post("/api/cart/add", kiemTraTaiKhoan, async (req, res) => {
  try {
    const { productId, soLuong } = req.body;

    const id = String(productId || "");
    const quantity = Number(soLuong || 1);

    if (
      !mongoose.isValidObjectId(id) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Sản phẩm hoặc số lượng không hợp lệ!",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    if (Number(product.soLuong) < quantity) {
      return res.status(400).json({
        message: "Sản phẩm không đủ số lượng trong kho!",
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

    const itemIndex = cart.items.findIndex(
      (item) => String(item.productId) === String(product._id)
    );

    if (itemIndex >= 0) {
      const soLuongMoi = Number(cart.items[itemIndex].soLuong || 0) + quantity;

      if (soLuongMoi > Number(product.soLuong)) {
        return res.status(400).json({
          message: "Số lượng trong giỏ vượt quá tồn kho!",
        });
      }

      cart.items[itemIndex].soLuong = soLuongMoi;
    } else {
      cart.items.push({
        productId: product._id,
        tenSanPham: product.tenSanPham,
        hinhAnh: product.hinhAnh || "",
        gia: Number(product.gia),
        soLuong: quantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Đã thêm sản phẩm vào giỏ hàng!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi thêm giỏ hàng:", error);

    return res.status(500).json({
      message: "Không thể thêm sản phẩm vào giỏ hàng!",
    });
  }
});

// ======================================
// 16. CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG
// ======================================
app.put("/api/cart/:productId", kiemTraTaiKhoan, async (req, res) => {
  try {
    const productId = req.params.productId;
    const soLuong = Number(req.body.soLuong);

    if (
      !mongoose.isValidObjectId(productId) ||
      !Number.isInteger(soLuong) ||
      soLuong < 1
    ) {
      return res.status(400).json({
        message: "ID hoặc số lượng không hợp lệ!",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    if (soLuong > Number(product.soLuong)) {
      return res.status(400).json({
        message: "Số lượng vượt quá tồn kho!",
      });
    }

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Không tìm thấy giỏ hàng!",
      });
    }

    const item = cart.items.find(
      (sp) => String(sp.productId) === String(productId)
    );

    if (!item) {
      return res.status(404).json({
        message: "Sản phẩm không có trong giỏ hàng!",
      });
    }

    item.soLuong = soLuong;

    await cart.save();

    return res.status(200).json({
      message: "Cập nhật giỏ hàng thành công!",
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
// 17. XÓA SẢN PHẨM KHỎI GIỎ
// ======================================
app.delete("/api/cart/:productId", kiemTraTaiKhoan, async (req, res) => {
  try {
    const productId = req.params.productId;

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
        message: "Không tìm thấy giỏ hàng!",
      });
    }

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== String(productId)
    );

    await cart.save();

    return res.status(200).json({
      message: "Xóa sản phẩm khỏi giỏ hàng thành công!",
      cart,
    });
  } catch (error) {
    console.error("Lỗi xóa sản phẩm khỏi giỏ:", error);

    return res.status(500).json({
      message: "Không thể xóa sản phẩm khỏi giỏ hàng!",
    });
  }
});

// ======================================
// 18. TẠO ĐƠN HÀNG - TỰ ĐỘNG TRỪ KHO
// ======================================
app.post("/api/orders", kiemTraTaiKhoan, async (req, res) => {
  let session = null;

  try {
    const { hoTen, soDienThoai, diaChi, items, phuongThucThanhToan } = req.body;

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

    if (!["COD", "BANK_TRANSFER"].includes(phuongThucThanhToan)) {
      return res.status(400).json({
        message: "Phương thức thanh toán không hợp lệ!",
      });
    }

    // GỘP SẢN PHẨM TRÙNG ID
    const sanPhamGop = new Map();

    for (const sp of items) {
      const productId = String(sp.productId || sp._id || sp.id || "");
      const soLuong = Number(sp.soLuong || sp.quantity || 1);

      if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isInteger(soLuong) ||
        soLuong < 1
      ) {
        return res.status(400).json({
          message: "ID hoặc số lượng sản phẩm không hợp lệ!",
        });
      }

      const id = productId.toLowerCase();

      sanPhamGop.set(id, (sanPhamGop.get(id) || 0) + soLuong);
    }

    // BẮT ĐẦU GIAO DỊCH
    session = await mongoose.startSession();

    let donHangMoi = null;

    await session.withTransaction(async () => {
      let tongTien = 0;
      const danhSachSanPham = [];

      for (const [productId, soLuong] of sanPhamGop) {
        console.log("================================");
        console.log("KIỂM TRA SẢN PHẨM KHI ĐẶT HÀNG");
        console.log("Product ID nhận được:", productId);
        console.log("Số lượng đặt:", soLuong);
        console.log("Collection:", Product.collection.name);

        const product = await Product.findById(productId).session(session);

        console.log(
          "Kết quả tìm sản phẩm:",
          product ? product.tenSanPham : "KHÔNG TÌM THẤY"
        );

        if (!product) {
          throw Object.assign(new Error("Không tìm thấy sản phẩm!"), {
            statusCode: 404,
          });
        }

        const gia = Number(product.gia);

        if (!Number.isFinite(gia) || gia < 0) {
          throw Object.assign(new Error("Giá sản phẩm không hợp lệ!"), {
            statusCode: 400,
          });
        }

        // TRỪ KHO CÓ KIỂM TRA TỒN KHO
        const ketQuaTruKho = await Product.updateOne(
          {
            _id: product._id,
            soLuong: { $gte: soLuong },
          },
          {
            $inc: {
              soLuong: -soLuong,
            },
          },
          { session }
        );

        if (ketQuaTruKho.modifiedCount !== 1) {
          throw Object.assign(
            new Error(`Sản phẩm ${product.tenSanPham} không đủ hàng!`),
            { statusCode: 400 }
          );
        }

        tongTien += gia * soLuong;

        danhSachSanPham.push({
          productId: product._id,
          tenSanPham: product.tenSanPham,
          hinhAnh: product.hinhAnh || "",
          gia,
          soLuong,
        });
      }

      // TẠO ĐƠN HÀNG
      const ketQuaDonHang = await Order.create(
        [
          {
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

            daTruKho: true,
            daHoanKho: false,
          },
        ],
        { session }
      );

      donHangMoi = ketQuaDonHang[0];
    });

    return res.status(201).json({
      success: true,
      message: "Đặt hàng thành công! Kho đã được cập nhật.",
      order: donHangMoi,
    });
  } catch (error) {
    console.error("LỖI TẠO ĐƠN HÀNG:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể tạo đơn hàng!",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// ======================================
// 19. LẤY ĐƠN HÀNG CỦA KHÁCH HÀNG
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
// KHÁCH HÀNG - HỦY ĐƠN HÀNG
// CHỈ HỦY ĐƠN ĐANG CHỜ XÁC NHẬN
// ======================================
app.put("/api/orders/:id/cancel", kiemTraTaiKhoan, async (req, res) => {
  let session = null;

  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn hàng không hợp lệ!",
      });
    }

    session = await mongoose.startSession();

    let orderUpdated = null;
    let daHoanKhoTrongLanNay = false;

    await session.withTransaction(async () => {
      // Chỉ tìm đơn hàng thuộc tài khoản đang đăng nhập
      const order = await Order.findOne({
        _id: id,
        userId: req.user._id,
      }).session(session);

      if (!order) {
        throw Object.assign(
          new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền hủy!"),
          { statusCode: 404 }
        );
      }
      // KHÔNG CHO KHÁCH HỦY ĐƠN ĐÃ THANH TOÁN

      // KHÔNG CHO KHÁCH HỦY ĐƠN ĐÃ THANH TOÁN
      if (
        order.trangThaiThanhToan === "Đã thanh toán" ||
        order.trangThaiThanhToan === "Đã hoàn tiền"
      ) {
        throw Object.assign(
          new Error(
            "Đơn hàng đã thanh toán hoặc đã hoàn tiền, không thể tự hủy. Vui lòng liên hệ Admin để được hỗ trợ!"
          ),
          { statusCode: 400 }
        );
      }

      // Chỉ cho phép hủy đơn đang chờ xác nhận
      if (order.trangThaiDonHang !== "Chờ xác nhận") {
        throw Object.assign(
          new Error("Chỉ có thể hủy đơn hàng đang chờ xác nhận!"),
          { statusCode: 400 }
        );
      }

      // Hoàn kho nếu đơn đã trừ kho và chưa hoàn kho
      if (order.daTruKho === true && order.daHoanKho !== true) {
        for (const item of order.items || []) {
          const productId = item.productId;
          const soLuong = Number(item.soLuong);

          if (
            !productId ||
            !mongoose.isValidObjectId(String(productId)) ||
            !Number.isInteger(soLuong) ||
            soLuong < 1
          ) {
            throw Object.assign(
              new Error("Thông tin sản phẩm trong đơn hàng không hợp lệ!"),
              { statusCode: 400 }
            );
          }

          const ketQuaHoanKho = await Product.updateOne(
            { _id: productId },
            { $inc: { soLuong: soLuong } },
            { session }
          );

          if (ketQuaHoanKho.modifiedCount !== 1) {
            throw Object.assign(
              new Error("Không thể hoàn lại tồn kho sản phẩm!"),
              { statusCode: 404 }
            );
          }
        }

        order.daHoanKho = true;
        daHoanKhoTrongLanNay = true;
      }

      // Cập nhật trạng thái đơn hàng
      order.trangThaiDonHang = "Đã hủy";

      await order.save({ session });

      orderUpdated = order;
    });

    return res.status(200).json({
      success: true,
      message: daHoanKhoTrongLanNay
        ? "Hủy đơn thành công! Tồn kho đã được hoàn lại."
        : "Hủy đơn hàng thành công!",
      order: orderUpdated,
    });
  } catch (error) {
    console.error("LỖI KHÁCH HÀNG HỦY ĐƠN:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể hủy đơn hàng!",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// ======================================
// 20. ADMIN - DANH SÁCH TÀI KHOẢN
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
// 21. ADMIN - ĐỔI QUYỀN TÀI KHOẢN
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

    if (String(req.user._id) === String(id) && role !== "admin") {
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
    user.tokenVersion = Number(user.tokenVersion || 0) + 1;

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
// 22. ADMIN - XÓA TÀI KHOẢN
// ======================================
app.delete("/api/admin/users/:id", kiemTraAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID tài khoản không hợp lệ!",
      });
    }

    if (String(req.user._id) === String(id)) {
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
// 23. QUẢN LÝ - DANH SÁCH ĐƠN HÀNG
// ADMIN + NHÂN VIÊN
// ======================================
app.get("/api/admin/orders", kiemTraQuanLy, async (req, res) => {
  try {
    const orders = await Order.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đơn hàng!",
    });
  }
});

// ======================================
// 24. QUẢN LÝ - CẬP NHẬT TRẠNG THÁI ĐƠN
// ADMIN + NHÂN VIÊN
// ======================================

// ======================================
// 24. QUẢN LÝ - CẬP NHẬT TRẠNG THÁI ĐƠN
// ADMIN + NHÂN VIÊN
// ======================================

app.put("/api/admin/orders/:id/status", kiemTraQuanLy, async (req, res) => {
  let session = null;

  try {
    const { trangThaiDonHang } = req.body;
    const id = req.params.id;

    const trangThaiHopLe = [
      "Chờ xác nhận",
      "Đã xác nhận",
      "Đang giao hàng",
      "Đã hoàn thành",
      "Đã hủy",
    ];

    if (!trangThaiHopLe.includes(trangThaiDonHang)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ!",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn hàng không hợp lệ!",
      });
    }

    session = await mongoose.startSession();

    let orderUpdated = null;
    let daHoanKhoTrongLanNay = false;
    let taoYeuCauHoanTien = false;

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        throw Object.assign(new Error("Không tìm thấy đơn hàng!"), {
          statusCode: 404,
        });
      }

      // ĐƠN ĐÃ HỦY KHÔNG ĐƯỢC MỞ LẠI
      if (
        order.trangThaiDonHang === "Đã hủy" &&
        trangThaiDonHang !== "Đã hủy"
      ) {
        throw Object.assign(
          new Error("Đơn hàng đã hủy, không thể chuyển sang trạng thái khác!"),
          { statusCode: 400 }
        );
      }

      // KHÔNG CHO HỦY ĐƠN ĐÃ GIAO HOÀN THÀNH
      if (
        trangThaiDonHang === "Đã hủy" &&
        order.trangThaiDonHang === "Đã hoàn thành"
      ) {
        throw Object.assign(
          new Error(
            "Đơn hàng đã hoàn thành. Không thể hủy trực tiếp, vui lòng xử lý theo quy trình đổi trả!"
          ),
          { statusCode: 400 }
        );
      }

      // KHÔNG CHO HỦY ĐƠN ĐANG GIAO
      if (
        trangThaiDonHang === "Đã hủy" &&
        order.trangThaiDonHang === "Đang giao hàng"
      ) {
        throw Object.assign(
          new Error(
            "Đơn hàng đang giao. Vui lòng xử lý việc giao hàng trước khi hủy!"
          ),
          { statusCode: 400 }
        );
      }

      // CHỈ HOÀN KHO KHI HỦY ĐƠN LẦN ĐẦU
      if (
        trangThaiDonHang === "Đã hủy" &&
        order.trangThaiDonHang !== "Đã hủy" &&
        order.daTruKho === true &&
        order.daHoanKho !== true
      ) {
        for (const item of order.items || []) {
          const productId = item.productId;
          const soLuong = Number(item.soLuong);

          if (
            !productId ||
            !mongoose.isValidObjectId(String(productId)) ||
            !Number.isInteger(soLuong) ||
            soLuong < 1
          ) {
            throw Object.assign(
              new Error("Thông tin sản phẩm trong đơn hàng không hợp lệ!"),
              { statusCode: 400 }
            );
          }

          const ketQuaHoanKho = await Product.updateOne(
            { _id: productId },
            { $inc: { soLuong: soLuong } },
            { session }
          );

          if (ketQuaHoanKho.modifiedCount !== 1) {
            throw Object.assign(
              new Error("Không tìm thấy sản phẩm để hoàn kho!"),
              { statusCode: 404 }
            );
          }
        }

        order.daHoanKho = true;
        daHoanKhoTrongLanNay = true;
      }

      // ======================================
      // XỬ LÝ YÊU CẦU HOÀN TIỀN
      // ======================================

      if (
        trangThaiDonHang === "Đã hủy" &&
        order.trangThaiDonHang !== "Đã hủy"
      ) {
        if (order.trangThaiThanhToan === "Đã thanh toán") {
          // ĐÃ THANH TOÁN: CHỜ ADMIN XỬ LÝ HOÀN TIỀN
          order.trangThaiHoanTien = "Chờ xử lý";
          order.ngayHoanTien = null;
          order.ghiChuHoanTien = "";
          taoYeuCauHoanTien = true;
        } else {
          // CHƯA THANH TOÁN: KHÔNG CẦN HOÀN TIỀN
          order.trangThaiHoanTien = "Không yêu cầu";
          order.ngayHoanTien = null;
          order.ghiChuHoanTien = "";
        }
      }

      // CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
      order.trangThaiDonHang = trangThaiDonHang;

      // COD: CHỈ ĐÁNH DẤU ĐÃ THANH TOÁN KHI HOÀN THÀNH
      if (
        trangThaiDonHang === "Đã hoàn thành" &&
        order.phuongThucThanhToan === "COD"
      ) {
        order.trangThaiThanhToan = "Đã thanh toán";
      }

      await order.save({ session });

      orderUpdated = order;
    });

    let message = "Cập nhật trạng thái đơn hàng thành công!";

    if (trangThaiDonHang === "Đã hủy") {
      if (taoYeuCauHoanTien) {
        message =
          "Đã hủy đơn hàng và tạo yêu cầu hoàn tiền. Admin cần xử lý hoàn tiền cho khách hàng.";
      } else {
        message = "Hủy đơn hàng thành công!";
      }

      if (daHoanKhoTrongLanNay) {
        message += " Tồn kho đã được hoàn lại.";
      }
    }

    return res.status(200).json({
      success: true,
      message,
      order: orderUpdated,
    });
  } catch (error) {
    console.error("LỖI CẬP NHẬT TRẠNG THÁI / HOÀN KHO:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Không thể cập nhật trạng thái đơn hàng!",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// ======================================
// ADMIN - XÁC NHẬN ĐÃ NHẬN TIỀN CHUYỂN KHOẢN
// ======================================

app.put(
  "/api/admin/orders/:id/confirm-payment",
  kiemTraAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "ID đơn hàng không hợp lệ!",
        });
      }

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng!",
        });
      }

      // Chỉ xác nhận thanh toán chuyển khoản
      if (order.phuongThucThanhToan !== "BANK_TRANSFER") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng không sử dụng chuyển khoản ngân hàng!",
        });
      }

      // Không xác nhận thanh toán cho đơn đã hủy
      if (order.trangThaiDonHang === "Đã hủy") {
        return res.status(400).json({
          success: false,
          message: "Không thể xác nhận thanh toán cho đơn đã hủy!",
        });
      }

      // Không xác nhận lại đơn đã thanh toán
      if (order.trangThaiThanhToan === "Đã thanh toán") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng này đã được xác nhận thanh toán!",
        });
      }

      // XÁC NHẬN ĐÃ NHẬN TIỀN
      order.trangThaiThanhToan = "Đã thanh toán";

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Xác nhận đã nhận tiền chuyển khoản thành công!",
        order,
      });
    } catch (error) {
      console.error("LỖI XÁC NHẬN THANH TOÁN:", error);

      return res.status(500).json({
        success: false,
        message: "Không thể xác nhận thanh toán!",
      });
    }
  }
);

// ======================================
// ADMIN - XÁC NHẬN ĐÃ HOÀN TIỀN CHO KHÁCH
// ======================================

app.put(
  "/api/admin/orders/:id/confirm-refund",
  kiemTraAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ghiChuHoanTien } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "ID đơn hàng không hợp lệ!",
        });
      }

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng!",
        });
      }

      // CHỈ XỬ LÝ ĐƠN ĐÃ HỦY
      if (order.trangThaiDonHang !== "Đã hủy") {
        return res.status(400).json({
          success: false,
          message: "Chỉ hoàn tiền cho đơn hàng đã hủy!",
        });
      }

      // ĐƠN PHẢI ĐÃ THANH TOÁN
      if (order.trangThaiThanhToan !== "Đã thanh toán") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng chưa được thanh toán, không cần hoàn tiền!",
        });
      }

      // PHẢI CÓ YÊU CẦU HOÀN TIỀN
      if (order.trangThaiHoanTien !== "Chờ xử lý") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng không ở trạng thái chờ xử lý hoàn tiền!",
        });
      }

      // CẬP NHẬT HOÀN TIỀN
      order.trangThaiHoanTien = "Đã hoàn tiền";
      order.trangThaiThanhToan = "Đã hoàn tiền";
      order.ngayHoanTien = new Date();

      order.ghiChuHoanTien =
        typeof ghiChuHoanTien === "string"
          ? ghiChuHoanTien.trim().slice(0, 500)
          : "";

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Đã xác nhận hoàn tiền thành công!",
        order,
      });
    } catch (error) {
      console.error("LỖI XÁC NHẬN HOÀN TIỀN:", error);

      return res.status(500).json({
        success: false,
        message: "Không thể xác nhận hoàn tiền!",
      });
    }
  }
);

// ======================================
// 25. ADMIN - THỐNG KÊ WEBSITE
// ======================================
app.get("/api/admin/thong-ke", kiemTraAdmin, async (req, res) => {
  try {
    // TỔNG DOANH THU ĐƠN HÀNG ĐÃ HOÀN THÀNH
    const ketQuaDoanhThu = await Order.aggregate([
      {
        $match: {
          trangThaiDonHang: "Đã hoàn thành",
        },
      },
      {
        $group: {
          _id: null,
          tongDoanhThu: {
            $sum: "$tongTien",
          },
        },
      },
    ]);

    const tongDoanhThu =
      ketQuaDoanhThu.length > 0 ? ketQuaDoanhThu[0].tongDoanhThu : 0;

    // ĐẾM SẢN PHẨM
    const soLuongSanPham = await Product.countDocuments();

    // ĐẾM BÀI ĐĂNG SẢN PHẨM
    const soLuongBaiDang = await Product.countDocuments();

    return res.status(200).json({
      success: true,
      tongDoanhThu,
      soLuongSanPham,
      soLuongBaiDang,
    });
  } catch (error) {
    console.error("Lỗi thống kê Admin:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu thống kê!",
    });
  }
});

// ======================================
// API NHÂN VIÊN: XEM DANH SÁCH KHÁCH HÀNG
// ======================================
app.get("/api/staff/customers", kiemTraQuanLy, async (req, res) => {
  try {
    const customers = await User.find({
      role: "customer",
    })
      .select("_id hoTen email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("LỖI API KHÁCH HÀNG:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách khách hàng!",
    });
  }
});

// ======================================
// 26. API KHÔNG TỒN TẠI
// ======================================
app.use((req, res) => {
  return res.status(404).json({
    message: "Không tìm thấy API yêu cầu!",
  });
});

// ======================================
// 27. XỬ LÝ LỖI SERVER
// ======================================
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);

  res.status(err.status || 500).json({
    message: err.message || "Đã xảy ra lỗi server!",
  });
});

// ======================================
// 28. KHỞI ĐỘNG SERVER
// ======================================
async function startServer() {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("Không tìm thấy MONGO_URI trong file .env!");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("Không tìm thấy JWT_SECRET trong file .env!");
    }

    await mongoose.connect(MONGO_URI);

    console.log("=================================");
    console.log("MONGODB KẾT NỐI THÀNH CÔNG!");
    console.log("=================================");

    httpServer.listen(PORT, () => {
      console.log(`SERVER: http://localhost:${PORT}`);
      console.log(`HEALTH: http://localhost:${PORT}/api/health`);
      console.log("SOCKET.IO: ĐANG HOẠT ĐỘNG!");
      console.log("MH MOTO LIVE CHAT: SẴN SÀNG!");
    });
  } catch (error) {
    console.error("=================================");
    console.error("KHỞI ĐỘNG SERVER THẤT BẠI!");
    console.error(error);
    console.error("=================================");

    process.exit(1);
  }
}

startServer();

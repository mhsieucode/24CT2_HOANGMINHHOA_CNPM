const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/product");
const User = require("../models/user");

const router = express.Router();

// ======================================
// 1. TẠO THƯ MỤC UPLOAD ẢNH
// ======================================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================================
// 2. KIỂM TRA ĐĂNG NHẬP VÀ QUYỀN ADMIN
// ======================================

const kiemTraAdmin = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    // Chưa đăng nhập
    if (!userId) {
      return res.status(401).json({
        message: "Bạn cần đăng nhập để thực hiện chức năng này!",
      });
    }

    // Kiểm tra tài khoản trong MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại!",
      });
    }

    // Chỉ Admin được quản lý sản phẩm
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền quản lý sản phẩm!",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("LỖI KIỂM TRA ADMIN:", error);

    return res.status(401).json({
      message: "Không thể xác thực tài khoản!",
    });
  }
};

// ======================================
// 3. CẤU HÌNH MULTER UPLOAD ẢNH
// ======================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const tenFile = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, tenFile);
  },
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Vui lòng chọn file ảnh!"));
    }
  },
});

// ======================================
// 4. LẤY DANH SÁCH SẢN PHẨM
// Ai cũng được xem
// ======================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error("LỖI LẤY SẢN PHẨM:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách sản phẩm!",
    });
  }
});

// ======================================
// 5. THÊM SẢN PHẨM
// Chỉ ADMIN
// ======================================

router.post("/", kiemTraAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    // Kiểm tra dữ liệu
    if (!tenSanPham || gia === undefined || gia === "") {
      return res.status(400).json({
        message: "Vui lòng nhập tên và giá sản phẩm!",
      });
    }

    if (isNaN(Number(gia)) || Number(gia) < 0) {
      return res.status(400).json({
        message: "Giá sản phẩm không hợp lệ!",
      });
    }

    const sanPham = await Product.create({
      tenSanPham: tenSanPham.trim(),
      gia: Number(gia),
      moTa: moTa || "",
      soLuong: Number(soLuong || 0),
      danhMuc: danhMuc || "Xe moto",
      hinhAnh: req.file ? `/uploads/${req.file.filename}` : "",
    });

    console.log("ĐÃ THÊM SẢN PHẨM:", sanPham.tenSanPham);

    return res.status(201).json({
      message: "Thêm sản phẩm thành công!",
      product: sanPham,
    });
  } catch (error) {
    console.error("LỖI THÊM SẢN PHẨM:", error);

    return res.status(500).json({
      message: error.message || "Lỗi thêm sản phẩm!",
    });
  }
});

// ======================================
// 6. SỬA SẢN PHẨM
// Chỉ ADMIN
// ======================================

router.put("/:id", kiemTraAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    const sanPhamCu = await Product.findById(req.params.id);

    if (!sanPhamCu) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    // Kiểm tra giá
    if (
      gia === undefined ||
      gia === "" ||
      isNaN(Number(gia)) ||
      Number(gia) < 0
    ) {
      return res.status(400).json({
        message: "Giá sản phẩm không hợp lệ!",
      });
    }

    const duLieuCapNhat = {
      tenSanPham: tenSanPham ? tenSanPham.trim() : sanPhamCu.tenSanPham,

      gia: Number(gia),

      moTa: moTa || "",

      soLuong: Number(soLuong || 0),

      danhMuc: danhMuc || "Xe moto",
    };

    // Nếu Admin chọn ảnh mới
    if (req.file) {
      duLieuCapNhat.hinhAnh = `/uploads/${req.file.filename}`;
    }

    const sanPham = await Product.findByIdAndUpdate(
      req.params.id,
      duLieuCapNhat,
      {
        new: true,
        runValidators: true,
      }
    );

    // Cập nhật thành công mới xóa ảnh cũ
    if (
      req.file &&
      sanPhamCu.hinhAnh &&
      sanPhamCu.hinhAnh.startsWith("/uploads/")
    ) {
      const tenAnhCu = path.basename(sanPhamCu.hinhAnh);
      const duongDanAnhCu = path.join(uploadDir, tenAnhCu);

      if (fs.existsSync(duongDanAnhCu)) {
        fs.unlinkSync(duongDanAnhCu);
      }
    }

    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product: sanPham,
    });
  } catch (error) {
    console.error("LỖI SỬA SẢN PHẨM:", error);

    return res.status(500).json({
      message: error.message || "Lỗi cập nhật sản phẩm!",
    });
  }
});

// ======================================
// 7. XÓA SẢN PHẨM
// Chỉ ADMIN
// ======================================

router.delete("/:id", kiemTraAdmin, async (req, res) => {
  try {
    const sanPham = await Product.findByIdAndDelete(req.params.id);

    if (!sanPham) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    // Xóa ảnh trong thư mục uploads
    if (sanPham.hinhAnh && sanPham.hinhAnh.startsWith("/uploads/")) {
      const tenAnh = path.basename(sanPham.hinhAnh);
      const duongDanAnh = path.join(uploadDir, tenAnh);

      if (fs.existsSync(duongDanAnh)) {
        fs.unlinkSync(duongDanAnh);
      }
    }

    return res.status(200).json({
      message: "Xóa sản phẩm thành công!",
    });
  } catch (error) {
    console.error("LỖI XÓA SẢN PHẨM:", error);

    return res.status(500).json({
      message: error.message || "Lỗi xóa sản phẩm!",
    });
  }
});

// ======================================
// 8. XỬ LÝ LỖI UPLOAD ẢNH
// ======================================

router.use((error, req, res, next) => {
  console.error("LỖI UPLOAD ẢNH:", error.message);

  return res.status(400).json({
    message: error.message || "Lỗi upload ảnh!",
  });
});

// ======================================
// 9. XUẤT ROUTER
// ======================================

module.exports = router;

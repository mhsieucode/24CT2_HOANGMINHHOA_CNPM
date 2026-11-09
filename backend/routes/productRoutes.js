const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/product");

const router = express.Router();

// =========================
// TẠO THƯ MỤC UPLOAD
// =========================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =========================
// CẤU HÌNH MULTER
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,

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

// =========================
// LẤY DANH SÁCH SẢN PHẨM
// =========================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("LỖI LẤY SẢN PHẨM:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// THÊM SẢN PHẨM
// =========================

router.post("/", upload.single("hinhAnh"), async (req, res) => {
  try {
    console.log("Dữ liệu thêm sản phẩm:", req.body);
    console.log(
      "Ảnh nhận được:",
      req.file ? req.file.filename : "Không có ảnh"
    );

    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    if (!tenSanPham || gia === undefined || gia === "") {
      return res.status(400).json({
        message: "Vui lòng nhập tên và giá sản phẩm!",
      });
    }

    const sanPham = await Product.create({
      tenSanPham,
      gia: Number(gia),
      moTa: moTa || "",
      soLuong: Number(soLuong || 0),
      danhMuc: danhMuc || "Xe moto",
      hinhAnh: req.file ? `/uploads/${req.file.filename}` : "",
    });

    res.status(201).json({
      message: "Thêm sản phẩm thành công!",
      product: sanPham,
    });
  } catch (error) {
    console.error("LỖI THÊM SẢN PHẨM:", error);

    res.status(500).json({
      message: error.message || "Lỗi thêm sản phẩm",
    });
  }
});

// =========================
// SỬA SẢN PHẨM
// =========================

router.put("/:id", upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    const sanPhamCu = await Product.findById(req.params.id);

    if (!sanPhamCu) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    const duLieuCapNhat = {
      tenSanPham,
      gia: Number(gia),
      moTa: moTa || "",
      soLuong: Number(soLuong || 0),
      danhMuc: danhMuc || "Xe moto",
    };

    // Nếu chọn ảnh mới thì thay ảnh cũ
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

    res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product: sanPham,
    });
  } catch (error) {
    console.error("LỖI SỬA SẢN PHẨM:", error);

    res.status(500).json({
      message: error.message || "Lỗi cập nhật sản phẩm",
    });
  }
});

// =========================
// XÓA SẢN PHẨM
// =========================

router.delete("/:id", async (req, res) => {
  try {
    const sanPham = await Product.findByIdAndDelete(req.params.id);

    if (!sanPham) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    // Xóa ảnh trong thư mục nếu có
    if (sanPham.hinhAnh && sanPham.hinhAnh.startsWith("/uploads/")) {
      const tenAnh = path.basename(sanPham.hinhAnh);
      const duongDanAnh = path.join(uploadDir, tenAnh);

      if (fs.existsSync(duongDanAnh)) {
        fs.unlinkSync(duongDanAnh);
      }
    }

    res.status(200).json({
      message: "Xóa sản phẩm thành công!",
    });
  } catch (error) {
    console.error("LỖI XÓA SẢN PHẨM:", error);

    res.status(500).json({
      message: error.message || "Lỗi xóa sản phẩm",
    });
  }
});

module.exports = router;

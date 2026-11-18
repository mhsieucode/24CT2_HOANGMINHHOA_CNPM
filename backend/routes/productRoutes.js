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
// 2. DANH MỤC VÀ THÔNG SỐ KỸ THUẬT
// Phải khớp với QuanLySanPham.jsx
// ======================================

const DANH_MUC = ["Mũ", "Xe Moto", "Bánh xe", "Phụ tùng xe"];

const THONG_SO_THEO_DANH_MUC = {
  Mũ: ["Thương hiệu", "Loại mũ", "Chất liệu", "Kích thước"],

  "Xe Moto": [
    "Dung tích xi-lanh",
    "Công suất",
    "Loại động cơ",
    "Hộp số",
    "Màu sắc",
  ],

  "Bánh xe": ["Thương hiệu", "Kích thước", "Chất liệu", "Loại lốp"],

  "Phụ tùng xe": [
    "Thương hiệu",
    "Mã sản phẩm",
    "Chất liệu",
    "Dòng xe tương thích",
  ],
};

// ======================================
// 3. CHUẨN HÓA DANH MỤC
// ======================================

const chuanHoaDanhMuc = (danhMuc) => {
  if (danhMuc === "Xe moto") return "Xe Moto";
  return danhMuc;
};

// ======================================
// 4. XÓA ẢNH UPLOAD KHI CÓ LỖI
// ======================================

const xoaAnhUpload = (file) => {
  if (!file || !file.path) return;

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error("Không thể xóa ảnh:", error.message);
  }
};

// ======================================
// 5. CHUYỂN SẢN PHẨM THÀNH OBJECT
// ======================================

const chuyenSanPhamThanhObject = (sanPham) => {
  if (!sanPham) return null;

  if (typeof sanPham.toObject === "function") {
    return sanPham.toObject({
      flattenMaps: true,
      virtuals: true,
    });
  }

  return sanPham;
};

// ======================================
// 6. KIỂM TRA QUYỀN ADMIN
// ======================================

const kiemTraAdmin = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "Bạn cần đăng nhập để thực hiện chức năng này!",
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(401).json({
        message: "ID tài khoản không hợp lệ!",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại!",
      });
    }

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
// 7. XỬ LÝ THÔNG SỐ KỸ THUẬT
// ======================================

const xuLyThongSo = (duLieu, danhMuc) => {
  if (!THONG_SO_THEO_DANH_MUC[danhMuc]) {
    throw new Error("Danh mục sản phẩm không hợp lệ!");
  }

  if (duLieu === undefined || duLieu === null || duLieu === "") {
    return {};
  }

  let thongSo = duLieu;

  // Nhận dữ liệu JSON string từ FormData
  if (typeof thongSo === "string") {
    try {
      thongSo = JSON.parse(thongSo);
    } catch (error) {
      throw new Error("Thông số kỹ thuật không đúng định dạng JSON!");
    }
  }

  // Nhận dữ liệu dạng Map
  if (thongSo instanceof Map) {
    thongSo = Object.fromEntries(thongSo);
  }

  if (
    typeof thongSo !== "object" ||
    Array.isArray(thongSo) ||
    thongSo === null
  ) {
    throw new Error("Thông số kỹ thuật không hợp lệ!");
  }

  const ketQua = {};
  const danhSachTen = THONG_SO_THEO_DANH_MUC[danhMuc];

  danhSachTen.forEach((ten) => {
    const giaTri = thongSo[ten];

    if (giaTri === undefined || giaTri === null) return;

    const giaTriChuan = String(giaTri).trim();

    if (!giaTriChuan) return;

    if (giaTriChuan.length > 500) {
      throw new Error(`Thông số "${ten}" quá dài!`);
    }

    ketQua[ten] = giaTriChuan;
  });

  return ketQua;
};

// ======================================
// 8. LẤY THÔNG SỐ TỪ FRONTEND
// Hỗ trợ cả thongSo và thongSoKyThuat
// ======================================

const layThongSoTuRequest = (body) => {
  if (body.thongSoKyThuat !== undefined) {
    return body.thongSoKyThuat;
  }

  if (body.thongSo !== undefined) {
    return body.thongSo;
  }

  return undefined;
};

// ======================================
// 9. CẤU HÌNH UPLOAD ẢNH
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

// ======================================
// 10. LẤY DANH SÁCH SẢN PHẨM
// ======================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    const danhSach = products.map((item) => chuyenSanPhamThanhObject(item));

    return res.status(200).json(danhSach);
  } catch (error) {
    console.error("LỖI LẤY SẢN PHẨM:", error);

    return res.status(500).json({
      message: "Không thể lấy danh sách sản phẩm!",
    });
  }
});

// ======================================
// 11. LẤY CHI TIẾT SẢN PHẨM
// ======================================

router.get("/:id", async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    return res.status(200).json(chuyenSanPhamThanhObject(product));
  } catch (error) {
    console.error("LỖI LẤY CHI TIẾT SẢN PHẨM:", error);

    return res.status(500).json({
      message: "Không thể lấy chi tiết sản phẩm!",
    });
  }
});

// ======================================
// 12. THÊM SẢN PHẨM
// ======================================

router.post("/", kiemTraAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    // Kiểm tra tên sản phẩm
    if (!tenSanPham || !String(tenSanPham).trim()) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Vui lòng nhập tên sản phẩm!",
      });
    }

    // Kiểm tra giá
    if (
      gia === undefined ||
      gia === "" ||
      !Number.isFinite(Number(gia)) ||
      Number(gia) < 0
    ) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Giá sản phẩm không hợp lệ!",
      });
    }

    // Kiểm tra số lượng
    if (
      soLuong !== undefined &&
      (soLuong === "" ||
        !Number.isFinite(Number(soLuong)) ||
        Number(soLuong) < 0)
    ) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Số lượng sản phẩm không hợp lệ!",
      });
    }

    // Kiểm tra danh mục
    const danhMucMoi = chuanHoaDanhMuc(danhMuc || "Xe Moto");

    if (!DANH_MUC.includes(danhMucMoi)) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Danh mục sản phẩm không hợp lệ!",
      });
    }

    // Nhận thông số từ một trong hai tên trường
    const duLieuThongSo = layThongSoTuRequest(req.body);

    const thongSoMoi = xuLyThongSo(duLieuThongSo, danhMucMoi);

    // Tạo sản phẩm
    const sanPham = new Product({
      tenSanPham: String(tenSanPham).trim(),
      gia: Number(gia),
      moTa: moTa || "",
      soLuong: Number(soLuong || 0),
      danhMuc: danhMucMoi,
      hinhAnh: req.file ? `/uploads/${req.file.filename}` : "",

      // Lưu đồng bộ hai trường
      thongSo: thongSoMoi,
      thongSoKyThuat: thongSoMoi,
    });

    await sanPham.save();

    console.log("================================");
    console.log("ĐÃ THÊM SẢN PHẨM:", sanPham.tenSanPham);
    console.log("DANH MỤC:", sanPham.danhMuc);
    console.log("THÔNG SỐ:", thongSoMoi);
    console.log("================================");

    return res.status(201).json({
      message: "Thêm sản phẩm thành công!",
      product: chuyenSanPhamThanhObject(sanPham),
    });
  } catch (error) {
    console.error("LỖI THÊM SẢN PHẨM:", error);

    xoaAnhUpload(req.file);

    return res.status(400).json({
      message: error.message || "Lỗi thêm sản phẩm!",
    });
  }
});

// ======================================
// 13. CẬP NHẬT SẢN PHẨM
// ======================================

router.put("/:id", kiemTraAdmin, upload.single("hinhAnh"), async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    const sanPhamCu = await Product.findById(req.params.id);

    if (!sanPhamCu) {
      xoaAnhUpload(req.file);

      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    const danhMucCu = chuanHoaDanhMuc(sanPhamCu.danhMuc);
    const danhMucMoi = chuanHoaDanhMuc(danhMuc || danhMucCu || "Xe Moto");

    // Kiểm tra tên
    if (tenSanPham !== undefined && !String(tenSanPham).trim()) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Tên sản phẩm không được để trống!",
      });
    }

    // Kiểm tra giá
    if (
      gia === undefined ||
      gia === "" ||
      !Number.isFinite(Number(gia)) ||
      Number(gia) < 0
    ) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Giá sản phẩm không hợp lệ!",
      });
    }

    // Kiểm tra số lượng
    if (
      soLuong !== undefined &&
      (soLuong === "" ||
        !Number.isFinite(Number(soLuong)) ||
        Number(soLuong) < 0)
    ) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Số lượng sản phẩm không hợp lệ!",
      });
    }

    // Kiểm tra danh mục
    if (!DANH_MUC.includes(danhMucMoi)) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Danh mục sản phẩm không hợp lệ!",
      });
    }

    // Cập nhật thông tin cơ bản
    if (tenSanPham !== undefined) {
      sanPhamCu.tenSanPham = String(tenSanPham).trim();
    }

    sanPhamCu.gia = Number(gia);

    if (moTa !== undefined) {
      sanPhamCu.moTa = moTa;
    }

    if (soLuong !== undefined) {
      sanPhamCu.soLuong = Number(soLuong);
    }

    sanPhamCu.danhMuc = danhMucMoi;

    // ======================================
    // CẬP NHẬT THÔNG SỐ KỸ THUẬT
    // ======================================

    const duLieuThongSo = layThongSoTuRequest(req.body);

    if (duLieuThongSo !== undefined) {
      const thongSoMoi = xuLyThongSo(duLieuThongSo, danhMucMoi);

      sanPhamCu.set("thongSo", thongSoMoi);
      sanPhamCu.set("thongSoKyThuat", thongSoMoi);

      sanPhamCu.markModified("thongSo");
      sanPhamCu.markModified("thongSoKyThuat");
    } else if (danhMucMoi !== danhMucCu) {
      // Đổi danh mục mà không gửi thông số mới
      sanPhamCu.set("thongSo", {});
      sanPhamCu.set("thongSoKyThuat", {});

      sanPhamCu.markModified("thongSo");
      sanPhamCu.markModified("thongSoKyThuat");
    }

    // ======================================
    // CẬP NHẬT ẢNH
    // ======================================

    const anhCu = sanPhamCu.hinhAnh;

    if (req.file) {
      sanPhamCu.hinhAnh = `/uploads/${req.file.filename}`;
    }

    // Lưu MongoDB
    await sanPhamCu.save();

    console.log("================================");
    console.log("SẢN PHẨM ĐÃ CẬP NHẬT:", sanPhamCu.tenSanPham);
    console.log("DANH MỤC:", sanPhamCu.danhMuc);
    console.log("THÔNG SỐ NHẬN ĐƯỢC:", duLieuThongSo);
    console.log("THÔNG SỐ ĐÃ LƯU:", sanPhamCu.get("thongSoKyThuat"));
    console.log("================================");

    // Xóa ảnh cũ sau khi lưu thành công
    if (req.file && anhCu && anhCu.startsWith("/uploads/")) {
      const tenAnhCu = path.basename(anhCu);
      const duongDanAnhCu = path.join(uploadDir, tenAnhCu);

      try {
        if (fs.existsSync(duongDanAnhCu)) {
          fs.unlinkSync(duongDanAnhCu);
        }
      } catch (error) {
        console.error("Không xóa được ảnh cũ:", error.message);
      }
    }

    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công!",
      product: chuyenSanPhamThanhObject(sanPhamCu),
    });
  } catch (error) {
    console.error("LỖI CẬP NHẬT SẢN PHẨM:", error);

    xoaAnhUpload(req.file);

    return res.status(400).json({
      message: error.message || "Lỗi cập nhật sản phẩm!",
    });
  }
});

// ======================================
// 14. XÓA SẢN PHẨM
// ======================================

router.delete("/:id", kiemTraAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    const sanPham = await Product.findByIdAndDelete(req.params.id);

    if (!sanPham) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    if (sanPham.hinhAnh && sanPham.hinhAnh.startsWith("/uploads/")) {
      const tenAnh = path.basename(sanPham.hinhAnh);
      const duongDanAnh = path.join(uploadDir, tenAnh);

      try {
        if (fs.existsSync(duongDanAnh)) {
          fs.unlinkSync(duongDanAnh);
        }
      } catch (error) {
        console.error("Không xóa được ảnh sản phẩm:", error.message);
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
// 15. XỬ LÝ LỖI UPLOAD
// ======================================

router.use((error, req, res, next) => {
  console.error("LỖI UPLOAD ẢNH:", error.message);

  xoaAnhUpload(req.file);

  return res.status(400).json({
    message: error.message || "Lỗi upload ảnh!",
  });
});

// ======================================
// 16. XUẤT ROUTER
// ======================================

module.exports = router;

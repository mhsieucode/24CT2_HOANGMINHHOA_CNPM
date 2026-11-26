const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/product");
const Cart = require("../models/cart");
const Order = require("../models/order");
const { kiemTraQuanLy } = require("../middleware/auth");

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
// 6. XỬ LÝ THÔNG SỐ KỸ THUẬT
// ======================================

const xuLyThongSo = (duLieu, danhMuc) => {
  if (!THONG_SO_THEO_DANH_MUC[danhMuc]) {
    throw new Error("Danh mục sản phẩm không hợp lệ!");
  }

  if (duLieu === undefined || duLieu === null || duLieu === "") {
    return {};
  }

  let thongSo = duLieu;

  if (typeof thongSo === "string") {
    try {
      thongSo = JSON.parse(thongSo);
    } catch (error) {
      throw new Error("Thông số kỹ thuật không đúng định dạng JSON!");
    }
  }

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
// 7. KIỂM TRA SỐ LƯỢNG TỒN KHO
// CHỈ CHẤP NHẬN SỐ NGUYÊN KHÔNG ÂM
// ======================================

const soLuongHopLe = (value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return false;
  }

  if (typeof value === "string" && !value.trim()) {
    return false;
  }

  const soLuong = Number(value);

  return Number.isSafeInteger(soLuong) && soLuong >= 0;
};

// ======================================
// 8. LẤY THÔNG SỐ TỪ FRONTEND
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
// ADMIN VÀ NHÂN VIÊN ĐƯỢC THỰC HIỆN
// ======================================

router.post("/", kiemTraQuanLy, upload.single("hinhAnh"), async (req, res) => {
  try {
    const { tenSanPham, gia, moTa, soLuong, danhMuc } = req.body;

    if (!tenSanPham || !String(tenSanPham).trim()) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Vui lòng nhập tên sản phẩm!",
      });
    }

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

    // KIỂM TRA SỐ LƯỢNG TỒN KHO
    if (soLuong !== undefined && !soLuongHopLe(soLuong)) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Số lượng phải là số nguyên không âm!",
      });
    }

    const danhMucMoi = chuanHoaDanhMuc(danhMuc || "Xe Moto");

    if (!DANH_MUC.includes(danhMucMoi)) {
      xoaAnhUpload(req.file);

      return res.status(400).json({
        message: "Danh mục sản phẩm không hợp lệ!",
      });
    }

    const duLieuThongSo = layThongSoTuRequest(req.body);
    const thongSoMoi = xuLyThongSo(duLieuThongSo, danhMucMoi);

    const sanPham = new Product({
      tenSanPham: String(tenSanPham).trim(),
      gia: Number(gia),
      moTa: moTa || "",
      soLuong: Number(soLuong === undefined ? 0 : soLuong),
      danhMuc: danhMucMoi,
      hinhAnh: req.file ? `/uploads/${req.file.filename}` : "",
      thongSo: thongSoMoi,
      thongSoKyThuat: thongSoMoi,
    });

    await sanPham.save();

    console.log("================================");
    console.log("ĐÃ THÊM SẢN PHẨM:", sanPham.tenSanPham);
    console.log("NGƯỜI THỰC HIỆN:", req.user?.role);
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
// ADMIN VÀ NHÂN VIÊN ĐƯỢC THỰC HIỆN
// ======================================

router.put(
  "/:id",
  kiemTraQuanLy,
  upload.single("hinhAnh"),
  async (req, res) => {
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

      if (tenSanPham !== undefined && !String(tenSanPham).trim()) {
        xoaAnhUpload(req.file);

        return res.status(400).json({
          message: "Tên sản phẩm không được để trống!",
        });
      }

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

      // KIỂM TRA SỐ LƯỢNG TỒN KHO
      if (soLuong !== undefined && !soLuongHopLe(soLuong)) {
        xoaAnhUpload(req.file);

        return res.status(400).json({
          message: "Số lượng phải là số nguyên không âm!",
        });
      }

      if (!DANH_MUC.includes(danhMucMoi)) {
        xoaAnhUpload(req.file);

        return res.status(400).json({
          message: "Danh mục sản phẩm không hợp lệ!",
        });
      }

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

      const duLieuThongSo = layThongSoTuRequest(req.body);

      if (duLieuThongSo !== undefined) {
        const thongSoMoi = xuLyThongSo(duLieuThongSo, danhMucMoi);

        sanPhamCu.set("thongSo", thongSoMoi);
        sanPhamCu.set("thongSoKyThuat", thongSoMoi);

        sanPhamCu.markModified("thongSo");
        sanPhamCu.markModified("thongSoKyThuat");
      } else if (danhMucMoi !== danhMucCu) {
        sanPhamCu.set("thongSo", {});
        sanPhamCu.set("thongSoKyThuat", {});

        sanPhamCu.markModified("thongSo");
        sanPhamCu.markModified("thongSoKyThuat");
      }

      const anhCu = sanPhamCu.hinhAnh;

      if (req.file) {
        sanPhamCu.hinhAnh = `/uploads/${req.file.filename}`;
      }

      await sanPhamCu.save();

      console.log("================================");
      console.log("SẢN PHẨM ĐÃ CẬP NHẬT:", sanPhamCu.tenSanPham);
      console.log("NGƯỜI THỰC HIỆN:", req.user?.role);
      console.log("DANH MỤC:", sanPhamCu.danhMuc);
      console.log("THÔNG SỐ NHẬN ĐƯỢC:", duLieuThongSo);
      console.log("THÔNG SỐ ĐÃ LƯU:", sanPhamCu.get("thongSoKyThuat"));
      console.log("================================");

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
  }
);

// ======================================
// 14. XÓA SẢN PHẨM AN TOÀN
// ADMIN VÀ NHÂN VIÊN ĐƯỢC THỰC HIỆN
// ======================================

router.delete("/:id", kiemTraQuanLy, async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. KIỂM TRA ID
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res.status(400).json({
        message: "ID sản phẩm không hợp lệ!",
      });
    }

    // 2. KIỂM TRA SẢN PHẨM CÓ TỒN TẠI
    const sanPham = await Product.findById(productId);

    if (!sanPham) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm!",
      });
    }

    // 3. KIỂM TRA SẢN PHẨM TRONG GIỎ HÀNG
    console.log("========== KIỂM TRA GIỎ HÀNG ==========");
    console.log("ID sản phẩm cần xóa:", productId);
    console.log("Tên Model Cart:", Cart.modelName);
    console.log("Collection Cart:", Cart.collection.name);

    const soGioHangCoSanPham = await Cart.countDocuments({
      "items.productId": productId,
    });

    console.log("Số giỏ hàng có sản phẩm này:", soGioHangCoSanPham);

    const sanPhamTrongGio = await Cart.findOne({
      "items.productId": productId,
    }).select("_id");

    console.log("Kết quả tìm thấy:", sanPhamTrongGio);
    console.log("=======================================");
    if (sanPhamTrongGio) {
      return res.status(409).json({
        message:
          "Không thể xóa sản phẩm này vì đang có trong giỏ hàng của khách hàng!",
      });
    }

    // 4. KIỂM TRA SẢN PHẨM TRONG LỊCH SỬ ĐƠN HÀNG
    const sanPhamTrongDon = await Order.findOne({
      "items.productId": productId,
    }).select("_id");

    if (sanPhamTrongDon) {
      return res.status(409).json({
        message:
          "Không thể xóa sản phẩm này vì đã xuất hiện trong lịch sử đơn hàng!",
      });
    }

    // 5. CHỈ XÓA SẢN PHẨM KHI ĐÃ QUA CÁC BƯỚC KIỂM TRA
    const sanPhamDaXoa = await Product.findByIdAndDelete(productId);

    if (!sanPhamDaXoa) {
      return res.status(404).json({
        message: "Sản phẩm không còn tồn tại hoặc đã được xóa!",
      });
    }

    // 6. XÓA ẢNH SAU KHI XÓA SẢN PHẨM THÀNH CÔNG
    if (sanPhamDaXoa.hinhAnh && sanPhamDaXoa.hinhAnh.startsWith("/uploads/")) {
      const tenAnh = path.basename(sanPhamDaXoa.hinhAnh);
      const duongDanAnh = path.join(uploadDir, tenAnh);

      try {
        if (fs.existsSync(duongDanAnh)) {
          fs.unlinkSync(duongDanAnh);
        }
      } catch (error) {
        console.error("Không xóa được ảnh sản phẩm:", error.message);
      }
    }

    console.log("================================");
    console.log("ĐÃ XÓA SẢN PHẨM:", sanPhamDaXoa.tenSanPham);
    console.log("NGƯỜI THỰC HIỆN:", req.user?.role);
    console.log("================================");

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

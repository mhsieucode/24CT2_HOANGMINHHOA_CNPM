const mongoose = require("mongoose");

// ======================================================
// MODEL SẢN PHẨM MH MOTO
// ======================================================

const productSchema = new mongoose.Schema(
  {
    // ======================================
    // 1. TÊN SẢN PHẨM
    // ======================================

    tenSanPham: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm!"],
      trim: true,
      minlength: [2, "Tên sản phẩm phải có ít nhất 2 ký tự!"],
      maxlength: [200, "Tên sản phẩm không được vượt quá 200 ký tự!"],
    },

    // ======================================
    // 2. GIÁ SẢN PHẨM
    // ======================================

    gia: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm!"],
      min: [0, "Giá sản phẩm không được âm!"],
      validate: {
        validator: (value) => Number.isFinite(value) && value >= 0,
        message: "Giá sản phẩm phải là số hợp lệ!",
      },
    },

    // ======================================
    // 3. MÔ TẢ SẢN PHẨM
    // ======================================

    moTa: {
      type: String,
      default: "",
      trim: true,
      maxlength: [10000, "Mô tả sản phẩm quá dài!"],
    },

    // ======================================
    // 4. HÌNH ẢNH SẢN PHẨM
    // ======================================

    hinhAnh: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2048, "Đường dẫn hình ảnh quá dài!"],
    },

    // ======================================
    // 5. SỐ LƯỢNG TỒN KHO
    // ======================================

    soLuong: {
      type: Number,
      default: 0,
      min: [0, "Số lượng tồn kho không được âm!"],
      validate: {
        validator: (value) => Number.isInteger(value) && value >= 0,
        message: "Số lượng tồn kho phải là số nguyên không âm!",
      },
    },

    // ======================================
    // 6. DANH MỤC SẢN PHẨM
    // ======================================

    danhMuc: {
      type: String,
      default: "Xe Moto",
      trim: true,
      maxlength: [100, "Tên danh mục quá dài!"],
    },

    // ======================================
    // 7. THÔNG SỐ SẢN PHẨM
    // ======================================

    thongSo: {
      type: Map,
      of: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      default: {},
    },

    // ======================================
    // 8. THÔNG SỐ KỸ THUẬT
    // ======================================

    thongSoKyThuat: {
      type: Map,
      of: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      default: {},
    },

    // ======================================
    // 9. TRẠNG THÁI KINH DOANH
    // ======================================

    trangThai: {
      type: String,
      enum: {
        values: ["Đang kinh doanh", "Ngừng kinh doanh"],
        message: "Trạng thái kinh doanh không hợp lệ!",
      },
      default: "Đang kinh doanh",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// ======================================================
// 10. INDEX TÌM KIẾM SẢN PHẨM
// ======================================================

productSchema.index({ danhMuc: 1 });
productSchema.index({ gia: 1 });
productSchema.index({ createdAt: -1 });

// Hỗ trợ lọc sản phẩm theo trạng thái
productSchema.index({ trangThai: 1 });

// ======================================================
// 11. XUẤT MODEL
// ======================================================

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);

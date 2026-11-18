const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ======================================
    // 1. THÔNG TIN CƠ BẢN
    // ======================================

    tenSanPham: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true,
    },

    gia: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm"],
      min: [0, "Giá không được âm"],
    },

    moTa: {
      type: String,
      default: "",
    },

    hinhAnh: {
      type: String,
      default: "",
    },

    soLuong: {
      type: Number,
      default: 0,
      min: 0,
    },

    danhMuc: {
      type: String,
      default: "Xe Moto",
    },

    // ======================================
    // 2. THÔNG SỐ KỸ THUẬT
    // ======================================

    // Trường thông số cũ, giữ lại để tương thích
    thongSo: {
      type: Map,
      of: String,
      default: {},
    },

    // Trường thông số mới
    thongSoKyThuat: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ======================================
// 3. MODEL PRODUCT
// ======================================

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);

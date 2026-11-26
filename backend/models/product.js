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
      minlength: [2, "Tên sản phẩm phải có ít nhất 2 ký tự"],
      maxlength: [200, "Tên sản phẩm không được vượt quá 200 ký tự"],
    },

    gia: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm"],
      min: [0, "Giá không được âm"],
      validate: {
        validator: Number.isFinite,
        message: "Giá sản phẩm phải là số hợp lệ",
      },
    },

    moTa: {
      type: String,
      default: "",
      trim: true,
    },

    hinhAnh: {
      type: String,
      default: "",
      trim: true,
    },

    soLuong: {
      type: Number,
      default: 0,
      min: [0, "Số lượng tồn kho không được âm"],
      validate: {
        validator: (value) => Number.isInteger(value) && value >= 0,
        message: "Số lượng tồn kho phải là số nguyên không âm",
      },
    },

    danhMuc: {
      type: String,
      default: "Xe Moto",
      trim: true,
    },

    // ======================================
    // 2. THÔNG SỐ KỸ THUẬT
    // ======================================

    thongSo: {
      type: Map,
      of: String,
      default: {},
    },

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

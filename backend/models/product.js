const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
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
      default: "Xe moto",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);

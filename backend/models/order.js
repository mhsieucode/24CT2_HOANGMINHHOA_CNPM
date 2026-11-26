const mongoose = require("mongoose");

// ======================================
// MODEL ĐƠN HÀNG MH MOTO
// ======================================

const orderSchema = new mongoose.Schema(
  {
    // ======================================
    // THÔNG TIN KHÁCH HÀNG
    // ======================================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hoTen: {
      type: String,
      required: true,
    },

    soDienThoai: {
      type: String,
      required: true,
    },

    diaChi: {
      type: String,
      required: true,
    },

    // ======================================
    // DANH SÁCH SẢN PHẨM TRONG ĐƠN HÀNG
    // ======================================
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          default: null,
        },

        tenSanPham: {
          type: String,
          required: true,
        },

        hinhAnh: {
          type: String,
          default: "",
        },

        gia: {
          type: Number,
          required: true,
        },

        soLuong: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    // ======================================
    // TỔNG TIỀN
    // ======================================
    tongTien: {
      type: Number,
      required: true,
    },

    // ======================================
    // PHƯƠNG THỨC THANH TOÁN
    // ======================================
    phuongThucThanhToan: {
      type: String,
      enum: ["COD", "BANK_TRANSFER"],
      required: true,
    },

    // ======================================
    // TRẠNG THÁI THANH TOÁN
    // ======================================
    trangThaiThanhToan: {
      type: String,
      default: "Chưa thanh toán",
    },

    // ======================================
    // TRẠNG THÁI ĐƠN HÀNG
    // ======================================
    trangThaiDonHang: {
      type: String,
      default: "Chờ xác nhận",
    },

    // ======================================
    // QUẢN LÝ KHO HÀNG
    // ======================================

    // ĐÃ TRỪ SỐ LƯỢNG SẢN PHẨM KHỎI KHO
    daTruKho: {
      type: Boolean,
      default: false,
    },

    // ĐÃ HOÀN SỐ LƯỢNG SẢN PHẨM VÀO KHO
    daHoanKho: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // QUẢN LÝ HOÀN TIỀN
    // ======================================

    // TRẠNG THÁI HOÀN TIỀN
    trangThaiHoanTien: {
      type: String,
      enum: ["Không yêu cầu", "Chờ xử lý", "Đã hoàn tiền", "Từ chối"],
      default: "Không yêu cầu",
    },

    // NGÀY XÁC NHẬN HOÀN TIỀN
    ngayHoanTien: {
      type: Date,
      default: null,
    },

    // GHI CHÚ XỬ LÝ HOÀN TIỀN
    ghiChuHoanTien: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================
// EXPORT MODEL
// ======================================
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);

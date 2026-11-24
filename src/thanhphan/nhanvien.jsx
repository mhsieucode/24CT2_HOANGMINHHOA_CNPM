import { useState } from "react";

import QuanLySanPham from "./quanlysanpham";
import QuanLyDonHang from "./quanlydonhang";
import QuanLyKhachHang from "./quanlykhachhang";
import "../App.css";

// ======================================
// DASHBOARD NHÂN VIÊN MH MOTO
// ======================================

function NhanVien({ user, dangXuat }) {
  const [manHinh, setManHinh] = useState("dashboard");

  // QUAY VỀ DASHBOARD
  const quayVeDashboard = () => {
    setManHinh("dashboard");
  };

  // MỞ QUẢN LÝ SẢN PHẨM
  if (manHinh === "sanpham") {
    return <QuanLySanPham dong={quayVeDashboard} />;
  }

  // MỞ QUẢN LÝ ĐƠN HÀNG
  if (manHinh === "donhang") {
    return <QuanLyDonHang dong={quayVeDashboard} />;
  }
  // MỞ MÀN HÌNH KHÁCH HÀNG
  // MỞ QUẢN LÝ KHÁCH HÀNG
  if (manHinh === "khachhang") {
    return <QuanLyKhachHang dong={quayVeDashboard} />;
  } // ======================================
  // DASHBOARD CHÍNH
  // ======================================

  return (
    <div className="nhanvien-page">
      {/* HEADER */}
      <div className="nhanvien-header">
        <div>
          <h1>NHÂN VIÊN MH MOTO</h1>

          <p>
            Xin chào, <strong>{user?.hoTen || "Nhân viên"}</strong>
          </p>
        </div>

        <button className="nhanvien-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* MENU */}
      <div className="nhanvien-menu">
        {/* QUẢN LÝ SẢN PHẨM */}
        <div className="nhanvien-card">
          <div className="nhanvien-icon">📦</div>

          <h2>Quản lý sản phẩm</h2>

          <p>Xem, thêm, chỉnh sửa và xóa sản phẩm trong cửa hàng.</p>

          <button onClick={() => setManHinh("sanpham")}>QUẢN LÝ</button>
        </div>

        {/* QUẢN LÝ ĐƠN HÀNG */}
        <div className="nhanvien-card">
          <div className="nhanvien-icon">🛒</div>

          <h2>Quản lý đơn hàng</h2>

          <p>Kiểm tra đơn hàng và cập nhật trạng thái giao hàng.</p>

          <button onClick={() => setManHinh("donhang")}>QUẢN LÝ</button>
        </div>

        {/* KHÁCH HÀNG */}
        <div className="nhanvien-card">
          <div className="nhanvien-icon">👥</div>

          <h2>Khách hàng</h2>

          <p>Xem thông tin cần thiết và hỗ trợ khách hàng.</p>

          <button onClick={() => setManHinh("khachhang")}>XEM</button>
        </div>
      </div>
    </div>
  );
}

export default NhanVien;

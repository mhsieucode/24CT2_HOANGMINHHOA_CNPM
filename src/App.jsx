import { useState, useEffect } from "react";
import "./App.css";

import DauTrang from "./thanhphan/dautrang";
import TrinhChieu from "./thanhphan/trinhchieu";
import DanhMuc from "./thanhphan/danhmuc";
import SanPham from "./thanhphan/sanpham";
import GioiThieu from "./thanhphan/gioithieu";
import ChanTrang from "./thanhphan/chantrang";
import DanhGia from "./thanhphan/danhgia";
import Poster from "./thanhphan/poster";

import DangNhap from "./thanhphan/dangnhap";
import DangKy from "./thanhphan/dangky";

import Admin from "./thanhphan/admin";
import NhanVien from "./thanhphan/nhanvien";
import GioHang from "./thanhphan/giohang";
import QuanLySanPham from "./thanhphan/quanlysanpham";
import ChatBox from "./thanhphan/chatbox";
import LichSuMuaHang from "./thanhphan/lichsumuahang";

// ======================================
// ĐỊA CHỈ BACKEND
// ======================================

const SERVER_URL = "http://localhost:5000";

function App() {
  // ======================================
  // HIỂN THỊ POPUP
  // ======================================

  const [hienDangNhap, setHienDangNhap] = useState(false);
  const [hienDangKy, setHienDangKy] = useState(false);

  // ======================================
  // HIỂN THỊ GIỎ HÀNG
  // ======================================

  const [hienGioHang, setHienGioHang] = useState(false);

  // ======================================
  // HIỂN THỊ LỊCH SỬ MUA HÀNG
  // ======================================

  const [hienLichSuMuaHang, setHienLichSuMuaHang] = useState(false);

  // ======================================
  // QUẢN LÝ SẢN PHẨM
  // ======================================

  const [hienQuanLySanPham, setHienQuanLySanPham] = useState(false);

  // ======================================
  // LỌC SẢN PHẨM
  // ======================================

  const [danhMucDangChon, setDanhMucDangChon] = useState("");

  const chonDanhMuc = (danhMuc) => {
    setDanhMucDangChon(danhMuc);
    setHienGioHang(false);
    setHienLichSuMuaHang(false);

    setTimeout(() => {
      document.getElementById("sanpham")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ======================================
  // THÔNG TIN NGƯỜI DÙNG
  // XÁC THỰC BẰNG JWT COOKIE
  // ======================================

  const [user, setUser] = useState(null);
  const [dangKiemTraPhien, setDangKiemTraPhien] = useState(true);

  // ======================================
  // KIỂM TRA PHIÊN ĐĂNG NHẬP
  // ======================================

  useEffect(() => {
    let conHoatDong = true;

    const kiemTraPhien = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!conHoatDong) return;

        if (response.ok && data.user) {
          setUser(data.user);

          console.log("ĐÃ KHÔI PHỤC PHIÊN JWT:", data.user);
        } else {
          setUser(null);
          console.log("CHƯA CÓ PHIÊN ĐĂNG NHẬP HỢP LỆ");
        }
      } catch (error) {
        console.error("LỖI KIỂM TRA PHIÊN:", error);

        if (conHoatDong) {
          setUser(null);
        }
      } finally {
        if (conHoatDong) {
          setDangKiemTraPhien(false);
        }
      }
    };

    kiemTraPhien();

    return () => {
      conHoatDong = false;
    };
  }, []);

  // ======================================
  // ĐĂNG NHẬP THÀNH CÔNG
  // ======================================

  const xuLyDangNhapThanhCong = (userData) => {
    if (!userData) return;

    setUser(userData);

    setHienDangNhap(false);
    setHienDangKy(false);

    setHienGioHang(false);
    setHienLichSuMuaHang(false);
    setHienQuanLySanPham(false);

    console.log("TÀI KHOẢN ĐÃ ĐĂNG NHẬP:", userData);
  };

  // ======================================
  // ĐĂNG XUẤT BẰNG JWT COOKIE
  // ======================================

  const xuLyDangXuat = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/dang-xuat`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Đăng xuất thất bại!");
        return;
      }

      // XÓA TRẠNG THÁI TÀI KHOẢN
      setUser(null);

      setHienGioHang(false);
      setHienLichSuMuaHang(false);
      setHienQuanLySanPham(false);
      setHienDangNhap(false);
      setHienDangKy(false);

      setDanhMucDangChon("");

      alert("Đã đăng xuất thành công!");
    } catch (error) {
      console.error("LỖI ĐĂNG XUẤT:", error);
      alert("Không thể kết nối đến server để đăng xuất!");
    }
  };

  // ======================================
  // MỞ / ĐÓNG GIỎ HÀNG
  // ======================================

  const dongGioHang = () => {
    setHienGioHang(false);
  };

  const moGioHang = () => {
    setHienGioHang(true);
    setHienLichSuMuaHang(false);
  };

  // ======================================
  // MỞ LỊCH SỬ MUA HÀNG
  // ======================================

  const moLichSuMuaHang = () => {
    if (!user || user.role !== "customer") {
      alert("Vui lòng đăng nhập bằng tài khoản khách hàng!");
      return;
    }

    setHienGioHang(false);
    setHienLichSuMuaHang(true);
  };

  // ======================================
  // ĐỢI KIỂM TRA JWT
  // ======================================

  if (dangKiemTraPhien) {
    return (
      <div className="web-layout">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#050505",
            color: "#e10600",
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textAlign: "center",
            padding: "20px",
          }}
        >
          MH MOTO - ĐANG KIỂM TRA PHIÊN ĐĂNG NHẬP...
        </div>
      </div>
    );
  }

  // ======================================
  // GIAO DIỆN CHÍNH
  // ======================================

  return (
    <div className="web-layout">
      {/* ======================================
          ADMIN
      ====================================== */}

      {user?.role === "admin" ? (
        hienQuanLySanPham ? (
          <QuanLySanPham dong={() => setHienQuanLySanPham(false)} />
        ) : (
          <Admin
            user={user}
            dangXuat={xuLyDangXuat}
            dongMoQuanLySanPham={() => setHienQuanLySanPham(true)}
          />
        )
      ) : user?.role === "staff" ? (
        /* ======================================
           NHÂN VIÊN
        ====================================== */

        <NhanVien user={user} dangXuat={xuLyDangXuat} />
      ) : (
        /* ======================================
           KHÁCH HÀNG / CHƯA ĐĂNG NHẬP
        ====================================== */

        <>
          <Poster />

          <div className="page">
            {/* HEADER */}

            <DauTrang
              user={user}
              setHienDangNhap={setHienDangNhap}
              setHienDangKy={setHienDangKy}
              xuLyDangXuat={xuLyDangXuat}
              moGioHang={moGioHang}
              dongGioHang={dongGioHang}
              moLichSuMuaHang={moLichSuMuaHang}
            />

            {/* NỘI DUNG WEBSITE */}

            {hienGioHang ? (
              <GioHang dong={dongGioHang} />
            ) : hienLichSuMuaHang ? (
              <LichSuMuaHang dong={() => setHienLichSuMuaHang(false)} />
            ) : (
              <>
                {/* TRANG CHỦ */}

                <div id="trangchu">
                  <TrinhChieu />

                  <DanhMuc onChonDanhMuc={chonDanhMuc} />
                </div>

                {/* SẢN PHẨM */}

                <div id="sanpham">
                  <SanPham
                    danhMuc={danhMucDangChon}
                    boLocDanhMuc={() => setDanhMucDangChon("")}
                  />
                </div>

                {/* GIỚI THIỆU */}

                <div id="gioithieu">
                  <GioiThieu />
                </div>

                {/* ĐÁNH GIÁ */}

                <DanhGia />

                {/* CHÂN TRANG */}

                <div id="lienhe">
                  <ChanTrang />
                </div>
              </>
            )}
          </div>

          {/* POPUP ĐĂNG NHẬP */}

          {hienDangNhap && (
            <DangNhap
              dong={() => setHienDangNhap(false)}
              sangDangKy={() => {
                setHienDangNhap(false);
                setHienDangKy(true);
              }}
              dangNhapThanhCong={xuLyDangNhapThanhCong}
            />
          )}

          {/* POPUP ĐĂNG KÝ */}

          {hienDangKy && (
            <DangKy
              dong={() => setHienDangKy(false)}
              sangDangNhap={() => {
                setHienDangKy(false);
                setHienDangNhap(true);
              }}
            />
          )}
        </>
      )}

      {/* ======================================
          LIVE CHAT
      ====================================== */}

      <ChatBox />
    </div>
  );
}

export default App;

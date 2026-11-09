import { useState } from "react";
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

function App() {
  // HIỂN THỊ POPUP
  const [hienDangNhap, setHienDangNhap] = useState(false);
  const [hienDangKy, setHienDangKy] = useState(false);

  // HIỂN THỊ GIỎ HÀNG
  const [hienGioHang, setHienGioHang] = useState(false);

  // HIỂN THỊ QUẢN LÝ SẢN PHẨM
  const [hienQuanLySanPham, setHienQuanLySanPham] = useState(false);

  // KIỂM TRA USER ĐÃ ĐĂNG NHẬP
  const [user, setUser] = useState(() => {
    const userDaLuu = localStorage.getItem("user");

    if (userDaLuu) {
      try {
        return JSON.parse(userDaLuu);
      } catch (error) {
        return null;
      }
    }

    return null;
  });

  // ĐĂNG XUẤT
  const xuLyDangXuat = () => {
    localStorage.removeItem("user");
    setUser(null);
    setHienGioHang(false);
    setHienQuanLySanPham(false);
    alert("Đã đăng xuất!");
  };

  // ĐÓNG GIỎ HÀNG
  const dongGioHang = () => {
    setHienGioHang(false);
  };

  // MỞ GIỎ HÀNG
  const moGioHang = () => {
    setHienGioHang(true);
  };

  return (
    <div className="web-layout">
      {/* ADMIN */}
      {user?.role === "admin" ? (
        hienQuanLySanPham ? (
          // MÀN HÌNH QUẢN LÝ SẢN PHẨM
          <QuanLySanPham dong={() => setHienQuanLySanPham(false)} />
        ) : (
          // MÀN HÌNH ADMIN DASHBOARD
          <Admin
            user={user}
            dangXuat={xuLyDangXuat}
            dongMoQuanLySanPham={() => setHienQuanLySanPham(true)}
          />
        )
      ) : user?.role === "staff" ? (
        // NHÂN VIÊN
        <NhanVien user={user} dangXuat={xuLyDangXuat} />
      ) : (
        // KHÁCH HÀNG / CHƯA ĐĂNG NHẬP
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
            />

            {/* NỘI DUNG WEBSITE */}
            {hienGioHang ? (
              <GioHang dong={dongGioHang} />
            ) : (
              <>
                <div id="trangchu">
                  <TrinhChieu />
                  <DanhMuc />
                </div>

                <div id="sanpham">
                  <SanPham />
                </div>

                <div id="gioithieu">
                  <GioiThieu />
                </div>

                <DanhGia />

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
              dangNhapThanhCong={(userData) => {
                console.log("USER ĐĂNG NHẬP:", userData);
                console.log("ROLE:", userData.role);

                setUser(userData);

                localStorage.setItem("user", JSON.stringify(userData));

                setHienDangNhap(false);
              }}
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
    </div>
  );
}

export default App;

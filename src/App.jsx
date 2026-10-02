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

function App() {
  const [hienDangNhap, setHienDangNhap] = useState(false);
  const [hienDangKy, setHienDangKy] = useState(false);

  return (
    <div className="web-layout">
      {/* POSTER */}
      <Poster />

      <div className="page">
        {/* HEADER */}
        <DauTrang />

        {/* NÚT ĐĂNG NHẬP - ĐĂNG KÝ */}
        <div className="auth-buttons">
          <button onClick={() => setHienDangNhap(true)}>ĐĂNG NHẬP</button>

          <button onClick={() => setHienDangKy(true)}>ĐĂNG KÝ</button>
        </div>

        {/* NỘI DUNG WEBSITE */}
        <TrinhChieu />

        <DanhMuc />

        <SanPham />

        <GioiThieu />

        <DanhGia />

        <ChanTrang />
      </div>

      {/* ĐĂNG NHẬP */}
      {hienDangNhap && (
        <DangNhap
          dong={() => setHienDangNhap(false)}
          sangDangKy={() => {
            setHienDangNhap(false);
            setHienDangKy(true);
          }}
        />
      )}

      {/* ĐĂNG KÝ */}
      {hienDangKy && (
        <DangKy
          dong={() => setHienDangKy(false)}
          sangDangNhap={() => {
            setHienDangKy(false);
            setHienDangNhap(true);
          }}
        />
      )}
    </div>
  );
}

export default App;

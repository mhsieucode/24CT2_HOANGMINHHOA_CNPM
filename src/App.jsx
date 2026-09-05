import "./App.css";

import DauTrang from "./thanhphan/dautrang";
import TrinhChieu from "./thanhphan/trinhchieu";
import DanhMuc from "./thanhphan/danhmuc";
import SanPham from "./thanhphan/sanpham";
import GioiThieu from "./thanhphan/gioithieu";
import ChanTrang from "./thanhphan/chantrang";
import DanhGia from "./thanhphan/danhgia";

function App() {
  return (
    <div className="page">
      <DauTrang />

      <TrinhChieu />

      <DanhMuc />

      <SanPham />

      <GioiThieu />

      <DanhGia />

      <ChanTrang />
    </div>
  );
}

export default App;

import { useState } from "react";
import "../App.css";

function GioHang({ dong }) {
  const [sanPham, setSanPham] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gioHang")) || [];
    } catch {
      return [];
    }
  });

  const capNhatGioHang = (danhSachMoi) => {
    setSanPham(danhSachMoi);
    localStorage.setItem("gioHang", JSON.stringify(danhSachMoi));
  };

  const tangSoLuong = (index) => {
    const danhSachMoi = [...sanPham];
    danhSachMoi[index].quantity =
      (Number(danhSachMoi[index].quantity) || 1) + 1;
    capNhatGioHang(danhSachMoi);
  };

  const giamSoLuong = (index) => {
    const danhSachMoi = [...sanPham];

    if (Number(danhSachMoi[index].quantity) > 1) {
      danhSachMoi[index].quantity -= 1;
      capNhatGioHang(danhSachMoi);
    }
  };

  const xoaSanPham = (index) => {
    const danhSachMoi = sanPham.filter((_, i) => i !== index);
    capNhatGioHang(danhSachMoi);
  };

  const tongTien = sanPham.reduce((tong, sp) => {
    return tong + Number(sp.price || sp.gia || 0) * Number(sp.quantity || 1);
  }, 0);

  const dinhDangTien = (tien) => tien.toLocaleString("vi-VN") + " đ";

  return (
    <div className="giohang-page">
      <div className="giohang-banner">
        <p>MOTO SHOP / GIỎ HÀNG</p>
        <h1>GIỎ HÀNG CỦA BẠN</h1>
        <span>Đam mê tốc độ - Chinh phục mọi hành trình</span>
      </div>

      <div className="giohang-container">
        <div className="giohang-left">
          <h2>
            Giỏ hàng <span>({sanPham.length})</span>
          </h2>

          {sanPham.length === 0 ? (
            <div className="giohang-trong">
              <div className="giohang-icon">🏍️</div>
              <h3>Giỏ hàng đang trống!</h3>
              <p>Hãy chọn chiếc moto yêu thích của bạn.</p>
              <button onClick={dong}>TIẾP TỤC MUA SẮM</button>
            </div>
          ) : (
            <>
              <div className="giohang-header">
                <span>SẢN PHẨM</span>
                <span>GIÁ</span>
                <span>SỐ LƯỢNG</span>
                <span>TỔNG</span>
              </div>

              {sanPham.map((sp, index) => (
                <div className="giohang-item" key={sp._id || sp.id || index}>
                  <div className="giohang-thongtin">
                    <img
                      src={sp.image || sp.hinhAnh || "/images/spmoto1.jpg"}
                      alt={sp.name || sp.ten}
                    />

                    <div>
                      <h3>{sp.name || sp.ten || "Xe moto"}</h3>
                      <p>MOTO SHOP</p>

                      <button
                        className="giohang-xoa"
                        onClick={() => xoaSanPham(index)}
                      >
                        ✕ Xóa
                      </button>
                    </div>
                  </div>

                  <div className="giohang-gia">
                    {dinhDangTien(Number(sp.price || sp.gia || 0))}
                  </div>

                  <div className="giohang-soluong">
                    <button onClick={() => giamSoLuong(index)}>−</button>
                    <span>{sp.quantity || 1}</span>
                    <button onClick={() => tangSoLuong(index)}>+</button>
                  </div>

                  <div className="giohang-tong">
                    {dinhDangTien(
                      Number(sp.price || sp.gia || 0) * Number(sp.quantity || 1)
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="giohang-right">
          <h2>ĐƠN HÀNG</h2>

          <div className="giohang-summary">
            <div>
              <span>Tạm tính</span>
              <span>{dinhDangTien(tongTien)}</span>
            </div>

            <div>
              <span>Phí vận chuyển</span>
              <span className="mienphi">MIỄN PHÍ</span>
            </div>

            <div className="giohang-total">
              <span>TỔNG TIỀN</span>
              <strong>{dinhDangTien(tongTien)}</strong>
            </div>

            <button
              className="giohang-thanhtoan"
              disabled={sanPham.length === 0}
              onClick={() => alert("Bạn đã chọn thanh toán!")}
            >
              TIẾN HÀNH THANH TOÁN →
            </button>

            <button className="giohang-tieptuc" onClick={dong}>
              ← TIẾP TỤC MUA SẮM
            </button>

            <p className="giohang-note">
              🔒 Thông tin thanh toán được bảo mật.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GioHang;

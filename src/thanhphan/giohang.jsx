import { useState } from "react";
import "../App.css";

// ======================================
// 1. ĐỊA CHỈ SERVER
// ======================================

const SERVER_URL = "http://localhost:5000";

// ======================================
// 2. XỬ LÝ ĐƯỜNG DẪN HÌNH ẢNH
// ======================================

const layDuongDanAnh = (url) => {
  if (!url) return "/image/fullface1.jpg";

  const duongDan = String(url).trim().replace(/\\/g, "/");

  // Ảnh đã có địa chỉ đầy đủ
  if (
    duongDan.startsWith("http://") ||
    duongDan.startsWith("https://") ||
    duongDan.startsWith("data:") ||
    duongDan.startsWith("blob:")
  ) {
    return duongDan;
  }

  // Ảnh nằm trong thư mục uploads của backend
  if (/^\/?uploads\//i.test(duongDan)) {
    return `${SERVER_URL}/${duongDan.replace(/^\/+/, "")}`;
  }

  // Ảnh nằm trong thư mục public/image hoặc public/images
  if (duongDan.startsWith("/image/") || duongDan.startsWith("/images/")) {
    return duongDan;
  }

  // Các đường dẫn bắt đầu bằng dấu /
  if (duongDan.startsWith("/")) {
    return duongDan;
  }

  return `/${duongDan}`;
};

// ======================================
// 3. COMPONENT GIỎ HÀNG
// ======================================

function GioHang({ dong }) {
  // LẤY GIỎ HÀNG TỪ LOCAL STORAGE
  const [sanPham, setSanPham] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gioHang")) || [];
    } catch {
      return [];
    }
  });

  // ======================================
  // 4. FORM THANH TOÁN
  // ======================================

  const [hienThanhToan, setHienThanhToan] = useState(false);

  // THÔNG TIN KHÁCH HÀNG
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [diaChi, setDiaChi] = useState("");

  // PHƯƠNG THỨC THANH TOÁN
  const [phuongThuc, setPhuongThuc] = useState("COD");

  // ======================================
  // 5. LẤY SỐ LƯỢNG SẢN PHẨM
  // ======================================

  const laySoLuong = (sp) => {
    return Number(sp.quantity ?? sp.soLuong ?? 1) || 1;
  };

  // ======================================
  // 6. LƯU VÀ CẬP NHẬT GIỎ HÀNG
  // ======================================

  const capNhatGioHang = (danhSachMoi) => {
    setSanPham(danhSachMoi);

    localStorage.setItem("gioHang", JSON.stringify(danhSachMoi));
  };

  // ======================================
  // 7. TĂNG SỐ LƯỢNG
  // ======================================

  const tangSoLuong = (index) => {
    const danhSachMoi = [...sanPham];

    const soLuongMoi = laySoLuong(danhSachMoi[index]) + 1;

    danhSachMoi[index] = {
      ...danhSachMoi[index],
      quantity: soLuongMoi,
      soLuong: soLuongMoi,
    };

    capNhatGioHang(danhSachMoi);
  };

  // ======================================
  // 8. GIẢM SỐ LƯỢNG
  // ======================================

  const giamSoLuong = (index) => {
    const danhSachMoi = [...sanPham];

    const soLuongHienTai = laySoLuong(danhSachMoi[index]);

    if (soLuongHienTai > 1) {
      const soLuongMoi = soLuongHienTai - 1;

      danhSachMoi[index] = {
        ...danhSachMoi[index],
        quantity: soLuongMoi,
        soLuong: soLuongMoi,
      };

      capNhatGioHang(danhSachMoi);
    }
  };

  // ======================================
  // 9. XÓA SẢN PHẨM
  // ======================================

  const xoaSanPham = (index) => {
    const danhSachMoi = sanPham.filter((_, i) => i !== index);

    capNhatGioHang(danhSachMoi);
  };

  // ======================================
  // 10. TÍNH TỔNG TIỀN
  // ======================================

  const tongTien = sanPham.reduce((tong, sp) => {
    const gia = Number(sp.price ?? sp.gia ?? 0);
    const soLuong = laySoLuong(sp);

    return tong + gia * soLuong;
  }, 0);

  // ĐỊNH DẠNG TIỀN
  const dinhDangTien = (tien) => {
    return Number(tien).toLocaleString("vi-VN") + " đ";
  };

  // ======================================
  // 11. XỬ LÝ ĐẶT HÀNG
  // ======================================

  const datHang = async (e) => {
    e.preventDefault();

    if (!hoTen.trim() || !soDienThoai.trim() || !diaChi.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (sanPham.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    let user = {};

    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    const donHang = {
      hoTen,
      soDienThoai,
      diaChi,
      phuongThucThanhToan: phuongThuc,

      items: sanPham.map((sp) => ({
        productId: sp._id || sp.id || "",
        tenSanPham: sp.name || sp.tenSanPham || sp.ten || "Sản phẩm",
        hinhAnh: layDuongDanAnh(sp.image || sp.hinhAnh),
        gia: Number(sp.price ?? sp.gia ?? 0),
        soLuong: laySoLuong(sp),
      })),

      tongTien,
    };

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id || user._id || "",
        },

        body: JSON.stringify(donHang),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Đặt hàng thất bại!");
        return;
      }

      alert("Đặt hàng thành công!");

      // XÓA GIỎ HÀNG SAU KHI ĐẶT HÀNG THÀNH CÔNG
      capNhatGioHang([]);

      setHienThanhToan(false);

      if (phuongThuc === "BANK_TRANSFER") {
        alert("Vui lòng chuyển khoản và chờ xác nhận thanh toán.");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);

      alert("Không thể kết nối server! Hãy kiểm tra backend.");
    }
  };

  // ======================================
  // 12. GIAO DIỆN GIỎ HÀNG
  // ======================================

  return (
    <div className="giohang-page">
      {/* BANNER GIỎ HÀNG */}
      <div className="giohang-banner">
        <p>MH MOTO / GIỎ HÀNG</p>

        <h1>GIỎ HÀNG CỦA BẠN</h1>

        <span>Đam mê tốc độ - Chinh phục mọi hành trình</span>
      </div>

      {/* NỘI DUNG GIỎ HÀNG */}
      <div className="giohang-container">
        {/* ==================================
            BÊN TRÁI: DANH SÁCH SẢN PHẨM
        ================================== */}

        <div className="giohang-left">
          <h2>
            Giỏ hàng <span>({sanPham.length})</span>
          </h2>

          {sanPham.length === 0 ? (
            <div className="giohang-trong">
              <h3>Giỏ hàng đang trống!</h3>

              <p>Hãy chọn chiếc moto yêu thích của bạn.</p>

              <button onClick={dong}>TIẾP TỤC MUA SẮM</button>
            </div>
          ) : (
            <>
              {/* TIÊU ĐỀ BẢNG */}
              <div className="giohang-header">
                <span>SẢN PHẨM</span>
                <span>GIÁ</span>
                <span>SỐ LƯỢNG</span>
                <span>TỔNG</span>
              </div>

              {/* DANH SÁCH SẢN PHẨM */}
              {sanPham.map((sp, index) => {
                const gia = Number(sp.price ?? sp.gia ?? 0);
                const soLuong = laySoLuong(sp);

                return (
                  <div className="giohang-item" key={sp._id || sp.id || index}>
                    {/* HÌNH ẢNH VÀ TÊN SẢN PHẨM */}
                    <div className="giohang-thongtin">
                      <img
                        src={layDuongDanAnh(sp.image || sp.hinhAnh)}
                        alt={sp.name || sp.tenSanPham || sp.ten || "Sản phẩm"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/image/fullface1.jpg";
                        }}
                      />

                      <div>
                        <h3>
                          {sp.name || sp.tenSanPham || sp.ten || "Xe moto"}
                        </h3>

                        <p>MH MOTO</p>

                        <button
                          className="giohang-xoa"
                          onClick={() => xoaSanPham(index)}
                        >
                          ✕ Xóa
                        </button>
                      </div>
                    </div>

                    {/* GIÁ */}
                    <div className="giohang-gia">{dinhDangTien(gia)}</div>

                    {/* SỐ LƯỢNG */}
                    <div className="giohang-soluong">
                      <button onClick={() => giamSoLuong(index)}>−</button>

                      <span>{soLuong}</span>

                      <button onClick={() => tangSoLuong(index)}>+</button>
                    </div>

                    {/* TỔNG TIỀN SẢN PHẨM */}
                    <div className="giohang-tong">
                      {dinhDangTien(gia * soLuong)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ==================================
            BÊN PHẢI: TỔNG ĐƠN HÀNG
        ================================== */}

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

            {/* MỞ FORM THANH TOÁN */}
            <button
              className="giohang-thanhtoan"
              disabled={sanPham.length === 0}
              onClick={() => setHienThanhToan(true)}
            >
              TIẾN HÀNH THANH TOÁN →
            </button>

            {/* TIẾP TỤC MUA SẮM */}
            <button className="giohang-tieptuc" onClick={dong}>
              ← TIẾP TỤC MUA SẮM
            </button>

            <p className="giohang-note">
              🔒 Thông tin thanh toán được bảo mật.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================
          13. FORM THANH TOÁN
      ====================================== */}

      {hienThanhToan && (
        <div className="thanhtoan-overlay">
          <div className="thanhtoan-form">
            {/* NÚT ĐÓNG */}
            <button
              className="thanhtoan-dong"
              onClick={() => setHienThanhToan(false)}
            >
              ✕
            </button>

            <h2>THÔNG TIN ĐẶT HÀNG</h2>

            <p>MH MOTO - Đam mê tốc độ</p>

            <form onSubmit={datHang}>
              {/* HỌ TÊN */}
              <label>Họ và tên</label>

              <input
                type="text"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />

              {/* SỐ ĐIỆN THOẠI */}
              <label>Số điện thoại</label>

              <input
                type="tel"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                placeholder="Nhập số điện thoại"
                required
              />

              {/* ĐỊA CHỈ */}
              <label>Địa chỉ giao hàng</label>

              <textarea
                value={diaChi}
                onChange={(e) => setDiaChi(e.target.value)}
                placeholder="Nhập địa chỉ giao hàng"
                required
              />

              {/* PHƯƠNG THỨC THANH TOÁN */}
              <label>Phương thức thanh toán</label>

              <select
                value={phuongThuc}
                onChange={(e) => setPhuongThuc(e.target.value)}
              >
                <option value="COD">Thanh toán khi nhận hàng (COD)</option>

                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
              </select>

              {/* MÃ QR CHUYỂN KHOẢN */}
              {phuongThuc === "BANK_TRANSFER" && (
                <div className="thanhtoan-qr">
                  <h3>QUÉT MÃ QR ĐỂ CHUYỂN KHOẢN</h3>

                  <p>
                    Sau khi đặt hàng, vui lòng chuyển khoản và chờ xác nhận.
                  </p>

                  <img
                    src="https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=0&addInfo=Thanh%20toan%20MH%20MOTO"
                    alt="QR chuyển khoản"
                  />

                  <p>Ngân hàng: VP BANK</p>
                  <p>Số tài khoản: 0923117504</p>
                  <p>Chủ tài khoản: HOANG MINH HOA</p>
                </div>
              )}

              {/* TỔNG TIỀN */}
              <div className="thanhtoan-tong">
                <span>Tổng tiền:</span>

                <strong>{dinhDangTien(tongTien)}</strong>
              </div>

              {/* XÁC NHẬN ĐẶT HÀNG */}
              <button type="submit" className="thanhtoan-xacnhan">
                XÁC NHẬN ĐẶT HÀNG
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GioHang;

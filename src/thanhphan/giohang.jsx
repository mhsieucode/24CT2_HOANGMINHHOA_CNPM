import { useEffect, useState } from "react";

const SERVER_URL = "http://localhost:5000";

// ======================================
// 1. HÀM XỬ LÝ ẢNH
// ======================================

const layDuongDanAnh = (anh) => {
  if (!anh) return "/image/fullface1.jpg";

  if (
    anh.startsWith("http://") ||
    anh.startsWith("https://") ||
    anh.startsWith("data:") ||
    anh.startsWith("blob:")
  ) {
    return anh;
  }

  if (anh.startsWith("/uploads/")) {
    return `${SERVER_URL}${anh}`;
  }

  return anh;
};

// ======================================
// 2. HÀM LẤY SỐ LƯỢNG
// ======================================

const laySoLuong = (sp) => {
  return Math.max(1, Number(sp.soLuong ?? sp.quantity ?? 1));
};

// ======================================
// 3. HÀM LẤY GIÁ
// ======================================

const layGia = (sp) => {
  return Number(sp.gia ?? sp.price ?? 0);
};

// ======================================
// 4. LẤY ID SẢN PHẨM
// ======================================

const layIdSanPham = (sp) => {
  const id =
    sp?.productId?._id ||
    sp?.productId?.id ||
    sp?.productId ||
    sp?._id ||
    sp?.id;

  return id ? String(id) : "";
};

// ======================================
// 5. ĐỊNH DẠNG TIỀN
// ======================================

const dinhDangTien = (soTien) => {
  return Number(soTien || 0).toLocaleString("vi-VN") + " ₫";
};

// ======================================
// 6. COMPONENT GIỎ HÀNG
// ======================================

function GioHang({ dong }) {
  const [sanPham, setSanPham] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem("gioHang") || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });

  const [hienThanhToan, setHienThanhToan] = useState(false);
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [phuongThuc, setPhuongThuc] = useState("COD");
  const [dangDatHang, setDangDatHang] = useState(false);
  const [dangDongBo, setDangDongBo] = useState(true);

  // ======================================
  // 7. CẬP NHẬT GIỎ HÀNG
  // ======================================

  const capNhatGioHang = (danhSachMoi) => {
    setSanPham(danhSachMoi);
    localStorage.setItem("gioHang", JSON.stringify(danhSachMoi));
  };

  // ======================================
  // 8. ĐỒNG BỘ GIỎ HÀNG VỚI DATABASE
  // ======================================

  const dongBoGioHang = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/products`);

      if (!response.ok) {
        throw new Error("Không thể lấy danh sách sản phẩm từ server!");
      }

      const data = await response.json();

      const danhSachSanPham = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : null;

      if (!danhSachSanPham) {
        throw new Error("Danh sách sản phẩm trả về không hợp lệ!");
      }

      const idSanPhamConTonTai = new Set(
        danhSachSanPham.map((sp) => layIdSanPham(sp)).filter(Boolean)
      );

      // Lấy dữ liệu giỏ hàng mới nhất
      const gioHangHienTai = JSON.parse(
        localStorage.getItem("gioHang") || "[]"
      );

      if (!Array.isArray(gioHangHienTai)) {
        throw new Error("Dữ liệu giỏ hàng không hợp lệ!");
      }

      // Loại sản phẩm đã bị xóa khỏi database
      // Sản phẩm không có ID được giữ lại để tránh mất dữ liệu cũ
      const gioHangMoi = gioHangHienTai.filter((sp) => {
        const id = layIdSanPham(sp);

        if (!id) return true;

        return idSanPhamConTonTai.has(id);
      });

      localStorage.setItem("gioHang", JSON.stringify(gioHangMoi));
      setSanPham(gioHangMoi);

      if (gioHangMoi.length < gioHangHienTai.length) {
        console.log(
          "MH MOTO: Đã tự động xóa sản phẩm không còn tồn tại khỏi giỏ hàng!"
        );
      }

      return {
        thanhCong: true,
        gioHang: gioHangMoi,
      };
    } catch (error) {
      console.error("LỖI ĐỒNG BỘ GIỎ HÀNG:", error);

      return {
        thanhCong: false,
        gioHang: sanPham,
        loi: error.message,
      };
    }
  };

  // ======================================
  // 9. TỰ ĐỘNG ĐỒNG BỘ KHI MỞ GIỎ HÀNG
  // ======================================

  useEffect(() => {
    let daHuy = false;

    const kiemTraGioHang = async () => {
      setDangDongBo(true);

      try {
        const response = await fetch(`${SERVER_URL}/api/products`);

        if (!response.ok) {
          throw new Error("Không thể lấy danh sách sản phẩm!");
        }

        const data = await response.json();

        const danhSachSanPham = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : null;

        if (!danhSachSanPham) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ!");
        }

        const idSanPhamConTonTai = new Set(
          danhSachSanPham.map((sp) => layIdSanPham(sp)).filter(Boolean)
        );

        const gioHangHienTai = JSON.parse(
          localStorage.getItem("gioHang") || "[]"
        );

        if (!Array.isArray(gioHangHienTai)) {
          throw new Error("Dữ liệu giỏ hàng không hợp lệ!");
        }

        const gioHangMoi = gioHangHienTai.filter((sp) => {
          const id = layIdSanPham(sp);

          if (!id) return true;

          return idSanPhamConTonTai.has(id);
        });

        if (daHuy) return;

        localStorage.setItem("gioHang", JSON.stringify(gioHangMoi));
        setSanPham(gioHangMoi);

        if (gioHangMoi.length !== gioHangHienTai.length) {
          console.log("Đã loại sản phẩm bị xóa khỏi giỏ hàng!");
        }
      } catch (error) {
        console.error("LỖI KIỂM TRA GIỎ HÀNG:", error);
      } finally {
        if (!daHuy) {
          setDangDongBo(false);
        }
      }
    };

    kiemTraGioHang();

    return () => {
      daHuy = true;
    };
  }, []);

  // ======================================
  // 10. TĂNG / GIẢM SỐ LƯỢNG
  // ======================================

  const thayDoiSoLuong = (index, thayDoi) => {
    const danhSachMoi = [...sanPham];

    const soLuongMoi = laySoLuong(danhSachMoi[index]) + thayDoi;

    if (soLuongMoi <= 0) {
      danhSachMoi.splice(index, 1);
    } else {
      danhSachMoi[index] = {
        ...danhSachMoi[index],
        soLuong: soLuongMoi,
        quantity: soLuongMoi,
      };
    }

    capNhatGioHang(danhSachMoi);
  };

  // ======================================
  // 11. XÓA SẢN PHẨM
  // ======================================

  const xoaSanPham = (index) => {
    const danhSachMoi = sanPham.filter((_, i) => i !== index);

    capNhatGioHang(danhSachMoi);
  };

  // ======================================
  // 12. TÍNH TỔNG TIỀN
  // ======================================

  const tongTien = sanPham.reduce((tong, sp) => {
    return tong + layGia(sp) * laySoLuong(sp);
  }, 0);

  const tongSoLuong = sanPham.reduce((tong, sp) => {
    return tong + laySoLuong(sp);
  }, 0);

  // ======================================
  // 13. LẤY TÊN SẢN PHẨM
  // ======================================

  const layTenSanPham = (sp) => {
    return sp.name || sp.tenSanPham || sp.ten || "Sản phẩm MH MOTO";
  };

  // ======================================
  // 14. XỬ LÝ ĐẶT HÀNG BẰNG JWT COOKIE
  // ======================================

  const datHang = async (e) => {
    e.preventDefault();

    if (dangDatHang) return;

    if (!hoTen.trim() || !soDienThoai.trim() || !diaChi.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (!/^[0-9+\s.-]{9,15}$/.test(soDienThoai.trim())) {
      alert("Số điện thoại không hợp lệ!");
      return;
    }

    if (!sanPham || sanPham.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    try {
      setDangDatHang(true);

      // KIỂM TRA LẠI SẢN PHẨM TRƯỚC KHI ĐẶT HÀNG
      const ketQuaDongBo = await dongBoGioHang();

      if (!ketQuaDongBo.thanhCong) {
        throw new Error("Không thể kiểm tra sản phẩm. Vui lòng thử lại!");
      }

      const gioHangHienTai = ketQuaDongBo.gioHang;

      if (gioHangHienTai.length === 0) {
        alert(
          "Các sản phẩm trong giỏ hàng không còn tồn tại. Vui lòng chọn sản phẩm khác!"
        );
        return;
      }

      const donHang = {
        hoTen: hoTen.trim(),
        soDienThoai: soDienThoai.trim(),
        diaChi: diaChi.trim(),
        phuongThucThanhToan: phuongThuc,

        items: gioHangHienTai.map((sp) => ({
          productId: layIdSanPham(sp),
          tenSanPham: layTenSanPham(sp),
          hinhAnh: layDuongDanAnh(sp.image || sp.hinhAnh),
          gia: layGia(sp),
          soLuong: laySoLuong(sp),
        })),

        tongTien: gioHangHienTai.reduce((tong, sp) => {
          return tong + layGia(sp) * laySoLuong(sp);
        }, 0),
      };

      const response = await fetch(`${SERVER_URL}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(donHang),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error("Server trả về dữ liệu không hợp lệ!");
      }

      if (response.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        return;
      }

      if (response.status === 403) {
        alert("Bạn không có quyền thực hiện thao tác này!");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Đặt hàng thất bại!");
      }

      alert("Đặt hàng thành công!");

      capNhatGioHang([]);
      setHienThanhToan(false);
      setHoTen("");
      setSoDienThoai("");
      setDiaChi("");
      setPhuongThuc("COD");

      if (phuongThuc === "BANK_TRANSFER") {
        alert("Vui lòng chuyển khoản và chờ xác nhận thanh toán.");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert(error.message || "Không thể kết nối server!");
    } finally {
      setDangDatHang(false);
    }
  };

  // ======================================
  // 15. GIAO DIỆN
  // ======================================

  return (
    <div className="mh-cart-overlay">
      <style>{`
        .mh-cart-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,.82);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #eee;
        }

        .mh-cart-container {
          width: 100%;
          max-width: 950px;
          max-height: 92vh;
          overflow-y: auto;
          background: #101010;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 15px 60px #000;
        }

        .mh-cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
          padding-bottom: 18px;
          margin-bottom: 22px;
        }

        .mh-cart-title {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 1px;
          margin: 0;
        }

        .mh-cart-title span {
          color: #e10600;
        }

        .mh-cart-close {
          background: #222;
          border: 1px solid #444;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 22px;
        }

        .mh-cart-close:hover {
          background: #e10600;
        }

        .mh-cart-item {
          display: grid;
          grid-template-columns: 105px 1fr auto;
          gap: 18px;
          align-items: center;
          padding: 17px 0;
          border-bottom: 1px solid #292929;
        }

        .mh-cart-image {
          width: 105px;
          height: 95px;
          object-fit: contain;
          background: #1b1b1b;
          border-radius: 8px;
        }

        .mh-cart-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .mh-cart-price {
          color: #e10600;
          font-weight: 700;
        }

        .mh-cart-quantity {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }

        .mh-cart-quantity button {
          width: 30px;
          height: 30px;
          border: 1px solid #444;
          background: #222;
          color: white;
          border-radius: 5px;
          cursor: pointer;
        }

        .mh-cart-quantity button:hover {
          background: #e10600;
        }

        .mh-cart-delete {
          background: transparent;
          border: none;
          color: #999;
          cursor: pointer;
          margin-top: 10px;
        }

        .mh-cart-delete:hover {
          color: #e10600;
        }

        .mh-cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .mh-cart-total strong {
          color: #e10600;
          font-size: 24px;
        }

        .mh-cart-button {
          border: none;
          background: #e10600;
          color: white;
          font-weight: 700;
          padding: 13px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: .2s;
        }

        .mh-cart-button:hover {
          background: #b90000;
          transform: translateY(-1px);
        }

        .mh-cart-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .mh-cart-empty {
          text-align: center;
          padding: 55px 15px;
          color: #aaa;
        }

        .mh-cart-empty-icon {
          font-size: 55px;
          margin-bottom: 15px;
        }

        .mh-checkout {
          margin-top: 20px;
          border-top: 1px solid #333;
          padding-top: 22px;
        }

        .mh-checkout h3 {
          font-size: 20px;
          margin: 0 0 20px;
        }

        .mh-checkout label {
          display: block;
          margin: 14px 0 7px;
          font-size: 14px;
          color: #ccc;
        }

        .mh-checkout input,
        .mh-checkout textarea,
        .mh-checkout select {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #444;
          background: #1c1c1c;
          color: white;
          outline: none;
          font-size: 14px;
        }

        .mh-checkout input:focus,
        .mh-checkout textarea:focus,
        .mh-checkout select:focus {
          border-color: #e10600;
        }

        .mh-checkout textarea {
          min-height: 85px;
          resize: vertical;
        }

        .mh-checkout-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .mh-cart-secondary {
          background: #292929;
          color: white;
          border: 1px solid #444;
          padding: 13px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        @media(max-width:600px) {
          .mh-cart-container {
            padding: 17px;
          }

          .mh-cart-item {
            grid-template-columns: 75px 1fr;
            gap: 12px;
          }

          .mh-cart-image {
            width: 75px;
            height: 75px;
          }

          .mh-cart-item-total {
            grid-column: 2;
          }

          .mh-cart-total {
            font-size: 15px;
          }

          .mh-cart-total strong {
            font-size: 19px;
          }

          .mh-checkout-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="mh-cart-container">
        <div className="mh-cart-header">
          <h2 className="mh-cart-title">
            GIỎ HÀNG <span>MH MOTO</span>
          </h2>

          <button
            className="mh-cart-close"
            onClick={() => dong && dong()}
            type="button"
            aria-label="Đóng giỏ hàng"
          >
            ×
          </button>
        </div>

        {dangDongBo ? (
          <div className="mh-cart-empty">
            <p>Đang kiểm tra giỏ hàng...</p>
          </div>
        ) : sanPham.length === 0 ? (
          <div className="mh-cart-empty">
            <div className="mh-cart-empty-icon">🛒</div>
            <h3>Giỏ hàng đang trống</h3>
            <p>Hãy chọn sản phẩm bạn yêu thích tại MH MOTO!</p>

            <button
              className="mh-cart-button"
              onClick={() => dong && dong()}
              type="button"
            >
              TIẾP TỤC MUA SẮM
            </button>
          </div>
        ) : (
          <>
            <p>
              Bạn đang có <strong>{tongSoLuong}</strong> sản phẩm trong giỏ hàng
            </p>

            {sanPham.map((sp, index) => (
              <div className="mh-cart-item" key={layIdSanPham(sp) || index}>
                <img
                  className="mh-cart-image"
                  src={layDuongDanAnh(sp.image || sp.hinhAnh)}
                  alt={layTenSanPham(sp)}
                />

                <div>
                  <div className="mh-cart-name">{layTenSanPham(sp)}</div>

                  <div className="mh-cart-price">
                    {dinhDangTien(layGia(sp))}
                  </div>

                  <div className="mh-cart-quantity">
                    <button
                      type="button"
                      onClick={() => thayDoiSoLuong(index, -1)}
                    >
                      −
                    </button>

                    <strong>{laySoLuong(sp)}</strong>

                    <button
                      type="button"
                      onClick={() => thayDoiSoLuong(index, 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="mh-cart-delete"
                    type="button"
                    onClick={() => xoaSanPham(index)}
                  >
                    Xóa sản phẩm
                  </button>
                </div>

                <div className="mh-cart-item-total">
                  <strong>{dinhDangTien(layGia(sp) * laySoLuong(sp))}</strong>
                </div>
              </div>
            ))}

            <div className="mh-cart-total">
              <span>TỔNG THANH TOÁN</span>
              <strong>{dinhDangTien(tongTien)}</strong>
            </div>

            {!hienThanhToan ? (
              <button
                className="mh-cart-button"
                type="button"
                style={{ width: "100%" }}
                onClick={() => setHienThanhToan(true)}
              >
                TIẾN HÀNH ĐẶT HÀNG
              </button>
            ) : (
              <form className="mh-checkout" onSubmit={datHang}>
                <h3>THÔNG TIN ĐẶT HÀNG</h3>

                <label>Họ và tên người nhận</label>
                <input
                  type="text"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />

                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={soDienThoai}
                  onChange={(e) => setSoDienThoai(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  required
                />

                <label>Địa chỉ giao hàng</label>
                <textarea
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  placeholder="Nhập địa chỉ nhận hàng"
                  required
                />

                <label>Phương thức thanh toán</label>
                <select
                  value={phuongThuc}
                  onChange={(e) => setPhuongThuc(e.target.value)}
                >
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>

                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                </select>

                <div className="mh-cart-total">
                  <span>THÀNH TIỀN</span>
                  <strong>{dinhDangTien(tongTien)}</strong>
                </div>

                <div className="mh-checkout-actions">
                  <button
                    className="mh-cart-button"
                    type="submit"
                    disabled={dangDatHang}
                  >
                    {dangDatHang ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
                  </button>

                  <button
                    className="mh-cart-secondary"
                    type="button"
                    onClick={() => setHienThanhToan(false)}
                  >
                    QUAY LẠI
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GioHang;

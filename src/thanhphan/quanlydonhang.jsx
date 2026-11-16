import { useEffect, useState, useCallback } from "react";
import "../App.css";

const API = "http://localhost:5000";

function QuanLyDonHang() {
  const [donHang, setDonHang] = useState([]);
  const [products, setProducts] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangCapNhat, setDangCapNhat] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id || "";

  // ======================================
  // LẤY ID SẢN PHẨM
  // ======================================

  const layProductId = (sp) => {
    if (!sp) return "";

    const id = sp.productId || sp.product?._id || sp.product || sp._id;

    if (typeof id === "object") {
      return String(id?._id || "");
    }

    return String(id || "");
  };

  // ======================================
  // CHUẨN HÓA ĐƯỜNG DẪN ẢNH
  // ======================================

  const layDuongDanAnh = (hinhAnh) => {
    if (!hinhAnh) return "";

    const duongDan = String(hinhAnh).trim();

    if (!duongDan) return "";

    if (
      duongDan.startsWith("http://") ||
      duongDan.startsWith("https://") ||
      duongDan.startsWith("data:image/") ||
      duongDan.startsWith("blob:")
    ) {
      return duongDan;
    }

    if (duongDan.startsWith("/image/") || duongDan.startsWith("/images/")) {
      return duongDan;
    }

    if (duongDan.startsWith("/uploads/")) {
      return `${API}${duongDan}`;
    }

    if (duongDan.startsWith("uploads/")) {
      return `${API}/${duongDan}`;
    }

    if (duongDan.startsWith("/")) {
      return `${API}${duongDan}`;
    }

    return `${API}/${duongDan}`;
  };

  // ======================================
  // ĐỊNH DẠNG TIỀN
  // ======================================

  const dinhDangTien = (gia) => {
    return `${Number(gia || 0).toLocaleString("vi-VN")} VNĐ`;
  };

  // ======================================
  // LẤY ĐƠN HÀNG VÀ SẢN PHẨM
  // ======================================

  const layDonHang = useCallback(async () => {
    try {
      setDangTai(true);

      const [responseSanPham, responseDonHang] = await Promise.all([
        fetch(`${API}/api/products`),

        fetch(`${API}/api/admin/orders`, {
          headers: {
            "x-user-id": userId,
          },
        }),
      ]);

      const dataSanPham = await responseSanPham.json();
      const dataDonHang = await responseDonHang.json();

      if (!responseSanPham.ok) {
        throw new Error(
          dataSanPham.message || "Không thể lấy danh sách sản phẩm!"
        );
      }

      if (!responseDonHang.ok) {
        throw new Error(
          dataDonHang.message || "Không thể lấy danh sách đơn hàng!"
        );
      }

      const danhSachSanPham = Array.isArray(dataSanPham)
        ? dataSanPham
        : dataSanPham.products || [];

      setProducts(danhSachSanPham);
      setDonHang(dataDonHang.orders || []);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTai(false);
    }
  }, [userId]);

  useEffect(() => {
    layDonHang();
  }, [layDonHang]);

  // ======================================
  // TÌM SẢN PHẨM TRONG DATABASE
  // ======================================

  const timSanPham = (sp) => {
    const productId = layProductId(sp);

    if (!productId) return null;

    return products.find(
      (product) => String(product._id) === String(productId)
    );
  };

  // ======================================
  // LẤY THÔNG TIN SẢN PHẨM
  // ======================================

  const layThongTinSanPham = (sp) => {
    const sanPhamDB = timSanPham(sp);

    const hinhAnh =
      sp.hinhAnh ||
      sp.image ||
      sp.anh ||
      sp.imageUrl ||
      sp.product?.hinhAnh ||
      sp.product?.image ||
      sanPhamDB?.hinhAnh ||
      sanPhamDB?.image ||
      "";

    const tenSanPham =
      sp.tenSanPham ||
      sp.name ||
      sp.product?.tenSanPham ||
      sanPhamDB?.tenSanPham ||
      "Sản phẩm";

    const gia = sp.gia ?? sp.price ?? sp.product?.gia ?? sanPhamDB?.gia ?? 0;

    const soLuong = sp.soLuong ?? sp.quantity ?? 1;

    return {
      hinhAnh: layDuongDanAnh(hinhAnh),
      tenSanPham,
      gia,
      soLuong,
    };
  };

  // ======================================
  // CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
  // ======================================

  const capNhatTrangThai = async (id, trangThaiMoi) => {
    try {
      setDangCapNhat(id);

      const response = await fetch(`${API}/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          trangThaiDonHang: trangThaiMoi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cập nhật trạng thái thất bại!");
      }

      setDonHang((danhSachCu) =>
        danhSachCu.map((don) =>
          don._id === id
            ? {
                ...don,
                trangThaiDonHang: trangThaiMoi,
              }
            : don
        )
      );

      alert("Cập nhật trạng thái thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangCapNhat("");
    }
  };

  // ======================================
  // THỐNG KÊ ĐƠN HÀNG
  // ======================================

  const tongDonHang = donHang.length;

  const donChoXacNhan = donHang.filter(
    (don) => (don.trangThaiDonHang || "Chờ xác nhận") === "Chờ xác nhận"
  ).length;

  const donDaXacNhan = donHang.filter(
    (don) => don.trangThaiDonHang === "Đã xác nhận"
  ).length;

  const donDangGiao = donHang.filter(
    (don) => don.trangThaiDonHang === "Đang giao hàng"
  ).length;

  const donHoanThanh = donHang.filter(
    (don) => don.trangThaiDonHang === "Đã hoàn thành"
  ).length;

  // ======================================
  // GIAO DIỆN ĐANG TẢI
  // ======================================

  if (dangTai) {
    return (
      <div className="donhang-loading">
        <div className="donhang-spinner"></div>
        Đang tải đơn hàng...
      </div>
    );
  }

  // ======================================
  // GIAO DIỆN QUẢN LÝ ĐƠN HÀNG
  // ======================================

  return (
    <div className="quan-ly-don-hang">
      {/* TIÊU ĐỀ */}

      <div className="donhang-header">
        <div>
          <h2>QUẢN LÝ ĐƠN HÀNG</h2>
          <p>MH MOTO · Quản lý đơn đặt hàng</p>
        </div>

        <button type="button" onClick={layDonHang}>
          ↻ Làm mới
        </button>
      </div>

      {/* THỐNG KÊ */}

      <div className="donhang-thong-ke">
        <div className="donhang-thong-ke-item">
          <span>Tổng đơn hàng</span>
          <strong>{tongDonHang}</strong>
        </div>

        <div className="donhang-thong-ke-item">
          <span>Chờ xác nhận</span>
          <strong>{donChoXacNhan}</strong>
        </div>

        <div className="donhang-thong-ke-item">
          <span>Đã xác nhận</span>
          <strong>{donDaXacNhan}</strong>
        </div>

        <div className="donhang-thong-ke-item">
          <span>Đang giao</span>
          <strong>{donDangGiao}</strong>
        </div>

        <div className="donhang-thong-ke-item">
          <span>Đã hoàn thành</span>
          <strong>{donHoanThanh}</strong>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}

      {donHang.length === 0 ? (
        <div className="donhang-trong">
          <span>📦</span>
          <p>Chưa có đơn hàng nào!</p>
        </div>
      ) : (
        <div className="donhang-danh-sach">
          {donHang.map((don) => (
            <div className="donhang-card" key={don._id}>
              {/* ĐẦU ĐƠN HÀNG */}

              <div className="donhang-card-header">
                <div className="donhang-ma">
                  <h3>
                    ĐƠN HÀNG #
                    {don._id ? don._id.slice(-6).toUpperCase() : "UNKNOWN"}
                  </h3>

                  <span>
                    Ngày đặt:{" "}
                    {don.createdAt
                      ? new Date(don.createdAt).toLocaleString("vi-VN")
                      : "Chưa có ngày đặt"}
                  </span>
                </div>

                <div className="donhang-tong-tien">
                  {dinhDangTien(don.tongTien)}
                </div>
              </div>

              {/* HAI CỘT NỘI DUNG */}

              <div className="donhang-noi-dung">
                {/* CỘT TRÁI: SẢN PHẨM */}

                <div className="donhang-cot-san-pham">
                  <h4>SẢN PHẨM ĐẶT MUA</h4>

                  {don.items?.length > 0 ? (
                    <div className="donhang-san-pham-list">
                      {don.items.map((sp, index) => {
                        const sanPham = layThongTinSanPham(sp);

                        return (
                          <div
                            className="donhang-san-pham-item"
                            key={sp.productId || sp._id || index}
                          >
                            {/* ẢNH SẢN PHẨM */}

                            <div className="donhang-anh-san-pham">
                              {sanPham.hinhAnh ? (
                                <>
                                  <img
                                    src={sanPham.hinhAnh}
                                    alt={sanPham.tenSanPham}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";

                                      const fallback =
                                        e.currentTarget.nextElementSibling;

                                      if (fallback) {
                                        fallback.style.display = "flex";
                                      }
                                    }}
                                  />

                                  <div
                                    className="donhang-anh-loi"
                                    style={{ display: "none" }}
                                  >
                                    🏍️
                                    <span>Không có ảnh</span>
                                  </div>
                                </>
                              ) : (
                                <div className="donhang-anh-loi">
                                  🏍️
                                  <span>Không có ảnh</span>
                                </div>
                              )}
                            </div>

                            {/* THÔNG TIN SẢN PHẨM */}

                            <div className="donhang-san-pham-info">
                              <p>{sanPham.tenSanPham}</p>

                              <small>
                                {dinhDangTien(sanPham.gia)}
                                {" × "}
                                {sanPham.soLuong}
                              </small>

                              <strong>
                                Thành tiền:{" "}
                                {dinhDangTien(
                                  Number(sanPham.gia) * Number(sanPham.soLuong)
                                )}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="donhang-khong-co-sp">
                      Đơn hàng chưa có thông tin sản phẩm.
                    </p>
                  )}
                </div>

                {/* CỘT PHẢI: THÔNG TIN KHÁCH HÀNG */}

                <div className="donhang-cot-thong-tin">
                  <h4>THÔNG TIN KHÁCH HÀNG</h4>

                  <div className="donhang-thong-tin">
                    <div>
                      <span>Khách hàng</span>
                      <strong>{don.hoTen || "Chưa có"}</strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>
                      <strong>{don.soDienThoai || "Chưa có"}</strong>
                    </div>

                    <div>
                      <span>Địa chỉ nhận hàng</span>
                      <strong>{don.diaChi || "Chưa có"}</strong>
                    </div>

                    <div>
                      <span>Phương thức thanh toán</span>
                      <strong>
                        {don.phuongThucThanhToan === "COD"
                          ? "Thanh toán khi nhận hàng"
                          : "Chuyển khoản ngân hàng"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRẠNG THÁI ĐƠN HÀNG */}

              <div className="donhang-cap-nhat">
                <label>TRẠNG THÁI ĐƠN HÀNG</label>

                <select
                  value={don.trangThaiDonHang || "Chờ xác nhận"}
                  disabled={dangCapNhat === don._id}
                  onChange={(e) => capNhatTrangThai(don._id, e.target.value)}
                >
                  <option value="Chờ xác nhận">Chờ xác nhận</option>

                  <option value="Đã xác nhận">Đã xác nhận</option>

                  <option value="Đang giao hàng">Đang giao hàng</option>

                  <option value="Đã hoàn thành">Đã hoàn thành</option>

                  <option value="Đã hủy">Đã hủy</option>
                </select>

                {dangCapNhat === don._id && (
                  <span className="donhang-dang-cap-nhat">
                    Đang cập nhật...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuanLyDonHang;

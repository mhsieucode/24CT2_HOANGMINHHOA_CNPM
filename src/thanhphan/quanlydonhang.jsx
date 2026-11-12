import { useEffect, useState } from "react";
import "../App.css";

// ======================================
// ĐỊA CHỈ API
// ======================================

const API = "http://localhost:5000";

// ======================================
// QUẢN LÝ ĐƠN HÀNG
// ======================================

function QuanLyDonHang() {
  const [donHang, setDonHang] = useState([]);
  const [products, setProducts] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;

  // ======================================
  // LẤY ID SẢN PHẨM
  // ======================================

  const layProductId = (sp) => {
    if (!sp) return "";

    const id = sp.productId || sp.product?._id || sp.product || sp._id;

    if (typeof id === "object") {
      return String(id._id || "");
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

    // Ảnh có đường dẫn đầy đủ
    if (
      duongDan.startsWith("http://") ||
      duongDan.startsWith("https://") ||
      duongDan.startsWith("data:image/")
    ) {
      return duongDan;
    }

    // Ảnh được upload lên backend
    if (duongDan.startsWith("/uploads/")) {
      return `${API}${duongDan}`;
    }

    // Ảnh nằm trong thư mục public của frontend
    if (duongDan.startsWith("/image/") || duongDan.startsWith("/images/")) {
      return duongDan;
    }

    // Ảnh có dạng uploads/tenanh.jpg
    if (duongDan.startsWith("uploads/")) {
      return `${API}/${duongDan}`;
    }

    // Đường dẫn tương đối khác
    if (duongDan.startsWith("/")) {
      return `${API}${duongDan}`;
    }

    return `${API}/${duongDan}`;
  };

  // ======================================
  // LẤY DANH SÁCH ĐƠN HÀNG VÀ SẢN PHẨM
  // ======================================

  const layDonHang = async () => {
    try {
      setDangTai(true);

      // LẤY DANH SÁCH SẢN PHẨM
      const responseSanPham = await fetch(`${API}/api/products`);

      const dataSanPham = await responseSanPham.json();

      if (!responseSanPham.ok) {
        throw new Error(
          dataSanPham.message || "Không thể lấy danh sách sản phẩm!"
        );
      }

      const danhSachSanPham = Array.isArray(dataSanPham)
        ? dataSanPham
        : dataSanPham.products || [];

      setProducts(danhSachSanPham);

      console.log("Danh sách sản phẩm:", danhSachSanPham);

      // LẤY DANH SÁCH ĐƠN HÀNG
      const response = await fetch(`${API}/api/admin/orders`, {
        headers: {
          "x-user-id": userId || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể lấy đơn hàng!");
        return;
      }

      const danhSachDonHang = data.orders || [];

      console.log("Danh sách đơn hàng:", danhSachDonHang);

      setDonHang(danhSachDonHang);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);

      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTai(false);
    }
  };

  // ======================================
  // TỰ ĐỘNG LẤY ĐƠN HÀNG
  // ======================================

  useEffect(() => {
    layDonHang();
  }, []);

  // ======================================
  // TÌM SẢN PHẨM TRONG MONGODB
  // ======================================

  const timSanPham = (sp) => {
    const productId = layProductId(sp);

    if (!productId) return null;

    return products.find(
      (product) => String(product._id) === String(productId)
    );
  };

  // ======================================
  // CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
  // ======================================

  const capNhatTrangThai = async (id, trangThaiMoi) => {
    try {
      const response = await fetch(`${API}/api/admin/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId || "",
        },
        body: JSON.stringify({
          trangThaiDonHang: trangThaiMoi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Cập nhật thất bại!");
        return;
      }

      alert("Cập nhật trạng thái thành công!");

      await layDonHang();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);

      alert("Không thể kết nối đến server!");
    }
  };

  // ======================================
  // ĐANG TẢI ĐƠN HÀNG
  // ======================================

  if (dangTai) {
    return <div className="donhang-loading">Đang tải đơn hàng...</div>;
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
          <p>MH MOTO - Quản lý đơn đặt hàng</p>
        </div>

        <button onClick={layDonHang}>Làm mới</button>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}

      {donHang.length === 0 ? (
        <div className="donhang-trong">Chưa có đơn hàng nào!</div>
      ) : (
        <div className="donhang-danh-sach">
          {donHang.map((don) => (
            <div className="donhang-card" key={don._id}>
              {/* THÔNG TIN ĐƠN HÀNG */}

              <div className="donhang-card-header">
                <div>
                  <h3>
                    Đơn hàng #
                    {don._id ? don._id.slice(-6).toUpperCase() : "UNKNOWN"}
                  </h3>

                  <p>
                    Ngày đặt:{" "}
                    {don.createdAt
                      ? new Date(don.createdAt).toLocaleString("vi-VN")
                      : "Chưa có"}
                  </p>
                </div>

                <span className="donhang-tong-tien">
                  {Number(don.tongTien || 0).toLocaleString("vi-VN")} VNĐ
                </span>
              </div>

              {/* THÔNG TIN KHÁCH HÀNG */}

              <div className="donhang-thong-tin">
                <p>
                  <strong>Khách hàng:</strong> {don.hoTen || "Chưa có"}
                </p>

                <p>
                  <strong>Số điện thoại:</strong> {don.soDienThoai || "Chưa có"}
                </p>

                <p>
                  <strong>Địa chỉ:</strong> {don.diaChi || "Chưa có"}
                </p>

                <p>
                  <strong>Thanh toán:</strong>{" "}
                  {don.phuongThucThanhToan === "COD"
                    ? "Thanh toán khi nhận hàng"
                    : "Chuyển khoản ngân hàng"}
                </p>
              </div>

              {/* DANH SÁCH SẢN PHẨM */}

              <div className="donhang-san-pham">
                <h4>Sản phẩm đặt mua</h4>

                {don.items?.length > 0 ? (
                  don.items.map((sp, index) => {
                    // TÌM SẢN PHẨM TRONG DATABASE

                    const sanPhamDB = timSanPham(sp);

                    // LẤY ẢNH TỪ ĐƠN HÀNG HOẶC DATABASE

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

                    const duongDanAnh = layDuongDanAnh(hinhAnh);

                    // TÊN SẢN PHẨM

                    const tenSanPham =
                      sp.tenSanPham ||
                      sp.name ||
                      sp.product?.tenSanPham ||
                      sanPhamDB?.tenSanPham ||
                      "Sản phẩm";

                    // GIÁ SẢN PHẨM

                    const giaSanPham =
                      sp.gia || sp.price || sanPhamDB?.gia || 0;

                    // SỐ LƯỢNG

                    const soLuong = sp.soLuong || sp.quantity || 1;

                    return (
                      <div
                        className="donhang-san-pham-item"
                        key={sp.productId || sp._id || index}
                      >
                        {/* ẢNH SẢN PHẨM */}

                        <div className="donhang-anh-san-pham">
                          {duongDanAnh ? (
                            <img
                              src={duongDanAnh}
                              alt={tenSanPham}
                              onLoad={() => {
                                console.log(
                                  "Ảnh sản phẩm hiển thị:",
                                  duongDanAnh
                                );
                              }}
                              onError={(e) => {
                                console.error(
                                  "Không tải được ảnh:",
                                  duongDanAnh
                                );

                                e.currentTarget.style.display = "none";

                                const anhLoi =
                                  e.currentTarget.nextElementSibling;

                                if (anhLoi) {
                                  anhLoi.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className="donhang-anh-loi"
                            style={{
                              display: duongDanAnh ? "none" : "flex",
                            }}
                          >
                            🏍️
                            <span>Không có ảnh</span>
                          </div>
                        </div>

                        {/* THÔNG TIN SẢN PHẨM */}

                        <div className="donhang-san-pham-info">
                          <p>{tenSanPham}</p>

                          <small>
                            {Number(giaSanPham).toLocaleString("vi-VN")} VNĐ ×{" "}
                            {soLuong}
                          </small>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>Đơn hàng chưa có thông tin sản phẩm.</p>
                )}
              </div>

              {/* CẬP NHẬT TRẠNG THÁI */}

              <div className="donhang-cap-nhat">
                <label>Trạng thái đơn hàng:</label>

                <select
                  value={don.trangThaiDonHang || "Chờ xác nhận"}
                  onChange={(e) => capNhatTrangThai(don._id, e.target.value)}
                >
                  <option value="Chờ xác nhận">Chờ xác nhận</option>

                  <option value="Đã xác nhận">Đã xác nhận</option>

                  <option value="Đang giao hàng">Đang giao hàng</option>

                  <option value="Đã hoàn thành">Đã hoàn thành</option>

                  <option value="Đã hủy">Đã hủy</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuanLyDonHang;

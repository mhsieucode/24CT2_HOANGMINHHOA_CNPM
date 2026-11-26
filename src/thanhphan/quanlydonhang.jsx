import { useEffect, useState, useCallback } from "react";
import "../App.css";

// ======================================
// 1. CẤU HÌNH SERVER
// ======================================

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

// ======================================
// 2. COMPONENT QUẢN LÝ ĐƠN HÀNG
// ======================================

function QuanLyDonHang({ dong }) {
  const [donHang, setDonHang] = useState([]);
  const [products, setProducts] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangCapNhat, setDangCapNhat] = useState("");
  const [loi, setLoi] = useState("");

  // LẤY QUYỀN TÀI KHOẢN ĐĂNG NHẬP
  const thongTinDangNhap = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const laAdmin = thongTinDangNhap?.role === "admin";

  // ======================================
  // 3. ĐỌC JSON AN TOÀN
  // ======================================

  const docJSON = async (response) => {
    const text = await response.text();

    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Server trả về dữ liệu không hợp lệ!");
    }
  };

  // ======================================
  // 4. LẤY ID SẢN PHẨM
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
  // 5. CHUẨN HÓA ĐƯỜNG DẪN ẢNH
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
  // 6. ĐỊNH DẠNG TIỀN
  // ======================================

  const dinhDangTien = (gia) => {
    return `${Number(gia || 0).toLocaleString("vi-VN")} VNĐ`;
  };

  // ======================================
  // 7. LẤY DANH SÁCH ĐƠN HÀNG
  // ======================================

  const layDonHang = useCallback(async () => {
    try {
      setDangTai(true);
      setLoi("");

      const [responseSanPham, responseDonHang] = await Promise.all([
        fetch(`${API}/api/products`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),

        fetch(`${API}/api/admin/orders`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      const [dataSanPham, dataDonHang] = await Promise.all([
        docJSON(responseSanPham),
        docJSON(responseDonHang),
      ]);

      if (!responseSanPham.ok) {
        throw new Error(
          dataSanPham.message || "Không thể lấy danh sách sản phẩm!"
        );
      }

      if (!responseDonHang.ok) {
        if (responseDonHang.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
          );
        }

        if (responseDonHang.status === 403) {
          throw new Error("Tài khoản không có quyền xem danh sách đơn hàng!");
        }

        throw new Error(
          dataDonHang.message || "Không thể lấy danh sách đơn hàng!"
        );
      }

      const danhSachSanPham = Array.isArray(dataSanPham)
        ? dataSanPham
        : dataSanPham.products || [];

      const danhSachDonHang = Array.isArray(dataDonHang)
        ? dataDonHang
        : dataDonHang.orders || dataDonHang.donHang || [];

      setProducts(danhSachSanPham);
      setDonHang(danhSachDonHang);
    } catch (error) {
      console.error("LỖI LẤY ĐƠN HÀNG:", error);
      setLoi(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTai(false);
    }
  }, []);

  // ======================================
  // 8. TỰ ĐỘNG TẢI ĐƠN HÀNG
  // ======================================

  useEffect(() => {
    layDonHang();
  }, [layDonHang]);

  // ======================================
  // 9. TÌM SẢN PHẨM TRONG DATABASE
  // ======================================

  const timSanPham = (sp) => {
    const productId = layProductId(sp);

    if (!productId) return null;

    return products.find(
      (product) => String(product._id) === String(productId)
    );
  };

  // ======================================
  // 10. LẤY THÔNG TIN SẢN PHẨM
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
  // 11. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
  // ======================================

  const capNhatTrangThai = async (id, trangThaiMoi) => {
    if (!id || dangCapNhat) return;

    if (
      trangThaiMoi === "Đã hủy" &&
      !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")
    ) {
      await layDonHang();
      return;
    }

    try {
      setDangCapNhat(id);
      setLoi("");

      const response = await fetch(`${API}/api/admin/orders/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          trangThaiDonHang: trangThaiMoi,
        }),
      });

      const data = await docJSON(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Cập nhật trạng thái đơn hàng thất bại!"
        );
      }

      alert(data.message || "Cập nhật trạng thái thành công!");

      await layDonHang();
    } catch (error) {
      console.error("LỖI CẬP NHẬT TRẠNG THÁI:", error);
      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangCapNhat("");
    }
  };

  // ======================================
  // 12. XÁC NHẬN ĐÃ NHẬN TIỀN CHUYỂN KHOẢN
  // ======================================

  const xacNhanThanhToan = async (id) => {
    const dongY = window.confirm(
      "Bạn đã kiểm tra tài khoản ngân hàng và xác nhận đã nhận tiền?"
    );

    if (!dongY) return;

    try {
      setDangCapNhat(id);

      const response = await fetch(
        `${API}/api/admin/orders/${id}/confirm-payment`,
        {
          method: "PUT",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      const data = await docJSON(response);

      if (!response.ok) {
        throw new Error(data.message || "Xác nhận thanh toán thất bại!");
      }

      alert(data.message || "Xác nhận thanh toán thành công!");

      await layDonHang();
    } catch (error) {
      console.error("LỖI XÁC NHẬN THANH TOÁN:", error);
      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangCapNhat("");
    }
  };

  // ======================================
  // 13. ADMIN XÁC NHẬN ĐÃ HOÀN TIỀN
  // ======================================

  const xacNhanHoanTien = async (id) => {
    if (!laAdmin) {
      alert("Chỉ Admin mới có quyền xác nhận hoàn tiền!");
      return;
    }

    const dongY = window.confirm(
      "Bạn đã thực sự chuyển khoản hoàn tiền cho khách hàng?\n\n" +
        "Chỉ xác nhận sau khi đã chuyển tiền thành công."
    );

    if (!dongY) return;

    const ghiChu = window.prompt(
      "Nhập ghi chú hoàn tiền (có thể để trống):",
      "Đã chuyển khoản hoàn tiền cho khách hàng"
    );

    if (ghiChu === null) return;

    try {
      setDangCapNhat(id);

      const response = await fetch(
        `${API}/api/admin/orders/${id}/confirm-refund`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ghiChuHoanTien: ghiChu,
          }),
        }
      );

      const data = await docJSON(response);

      if (!response.ok) {
        throw new Error(data.message || "Xác nhận hoàn tiền thất bại!");
      }

      alert(data.message || "Xác nhận hoàn tiền thành công!");

      await layDonHang();
    } catch (error) {
      console.error("LỖI XÁC NHẬN HOÀN TIỀN:", error);
      alert(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangCapNhat("");
    }
  };

  // ======================================
  // 14. THỐNG KÊ ĐƠN HÀNG
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

  const donChoHoanTien = donHang.filter(
    (don) => don.trangThaiHoanTien === "Chờ xử lý"
  ).length;

  // ======================================
  // 15. GIAO DIỆN ĐANG TẢI
  // ======================================

  if (dangTai) {
    return (
      <div className="quan-ly-don-hang">
        <div className="donhang-header">
          <div>
            <h2>QUẢN LÝ ĐƠN HÀNG</h2>
            <p>MH MOTO · Quản lý đơn đặt hàng</p>
          </div>

          {typeof dong === "function" && (
            <button type="button" onClick={dong}>
              ← Quay lại
            </button>
          )}
        </div>

        <div className="donhang-loading">
          <div className="donhang-spinner"></div>
          Đang tải đơn hàng...
        </div>
      </div>
    );
  }

  // ======================================
  // 16. GIAO DIỆN QUẢN LÝ ĐƠN HÀNG
  // ======================================

  return (
    <div className="quan-ly-don-hang">
      {/* TIÊU ĐỀ */}

      <div className="donhang-header">
        <div>
          <h2>QUẢN LÝ ĐƠN HÀNG</h2>
          <p>MH MOTO · Quản lý đơn đặt hàng</p>
        </div>

        <div className="donhang-header-actions">
          {typeof dong === "function" && (
            <button type="button" onClick={dong}>
              ← Quay lại Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={layDonHang}
            disabled={dangCapNhat !== ""}
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* THÔNG BÁO LỖI */}

      {loi && (
        <div className="donhang-loi">
          <p>{loi}</p>

          <button type="button" onClick={layDonHang}>
            Thử lại
          </button>
        </div>
      )}

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

        <div className="donhang-thong-ke-item">
          <span>Chờ hoàn tiền</span>
          <strong style={{ color: "#d97706" }}>{donChoHoanTien}</strong>
        </div>
      </div>

      {/* DANH SÁCH ĐƠN HÀNG */}

      {donHang.length === 0 ? (
        <div className="donhang-trong">
          <span>📦</span>
          <p>
            {loi
              ? "Không thể tải danh sách đơn hàng."
              : "Chưa có đơn hàng nào!"}
          </p>
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

                {/* CỘT PHẢI: KHÁCH HÀNG */}

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

                    <div>
                      <span>Trạng thái thanh toán</span>
                      <strong>
                        {don.trangThaiThanhToan || "Chưa thanh toán"}
                      </strong>
                    </div>

                    {/* XÁC NHẬN NHẬN TIỀN */}

                    {don.phuongThucThanhToan === "BANK_TRANSFER" &&
                      don.trangThaiThanhToan !== "Đã thanh toán" &&
                      don.trangThaiThanhToan !== "Đã hoàn tiền" &&
                      don.trangThaiDonHang !== "Đã hủy" && (
                        <button
                          type="button"
                          className="xac-nhan-thanh-toan-btn"
                          disabled={dangCapNhat !== ""}
                          onClick={() => xacNhanThanhToan(don._id)}
                        >
                          ✓ XÁC NHẬN ĐÃ NHẬN TIỀN
                        </button>
                      )}
                  </div>
                </div>
              </div>

              {/* ======================================
                  KHU VỰC QUẢN LÝ HOÀN TIỀN
              ====================================== */}

              {don.trangThaiHoanTien &&
                don.trangThaiHoanTien !== "Không yêu cầu" && (
                  <div
                    className="donhang-hoan-tien"
                    style={{
                      marginTop: "20px",
                      padding: "18px",
                      borderRadius: "10px",
                      border: "1px solid #e5a000",
                      background: "#fffaf0",
                      color: "#222",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 14px",
                        color: "#9a6700",
                        fontSize: "16px",
                      }}
                    >
                      💰 QUẢN LÝ HOÀN TIỀN
                    </h4>

                    <div style={{ marginBottom: "10px" }}>
                      <span>Trạng thái hoàn tiền: </span>

                      <strong
                        style={{
                          color:
                            don.trangThaiHoanTien === "Đã hoàn tiền"
                              ? "#16803d"
                              : don.trangThaiHoanTien === "Chờ xử lý"
                              ? "#d97706"
                              : "#b42318",
                        }}
                      >
                        {don.trangThaiHoanTien}
                      </strong>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <span>Số tiền cần hoàn: </span>
                      <strong>{dinhDangTien(don.tongTien)}</strong>
                    </div>

                    {don.ngayHoanTien && (
                      <div style={{ marginBottom: "10px" }}>
                        <span>Ngày hoàn tiền: </span>
                        <strong>
                          {new Date(don.ngayHoanTien).toLocaleString("vi-VN")}
                        </strong>
                      </div>
                    )}

                    {don.ghiChuHoanTien && (
                      <div style={{ marginBottom: "10px" }}>
                        <span>Ghi chú: </span>
                        <strong>{don.ghiChuHoanTien}</strong>
                      </div>
                    )}

                    {don.trangThaiHoanTien === "Chờ xử lý" && (
                      <>
                        <p
                          style={{
                            margin: "12px 0",
                            color: "#8a5b00",
                            fontSize: "13px",
                          }}
                        >
                          Đơn hàng đã thanh toán và bị hủy. Vui lòng chuyển
                          khoản hoàn tiền cho khách trước khi xác nhận hoàn tiền
                          trên hệ thống.
                        </p>

                        {laAdmin ? (
                          <button
                            type="button"
                            disabled={dangCapNhat !== ""}
                            onClick={() => xacNhanHoanTien(don._id)}
                            style={{
                              width: "100%",
                              padding: "13px",
                              background: "#16803d",
                              color: "#fff",
                              border: "none",
                              borderRadius: "7px",
                              fontWeight: "800",
                              cursor:
                                dangCapNhat !== "" ? "not-allowed" : "pointer",
                              opacity: dangCapNhat !== "" ? 0.6 : 1,
                            }}
                          >
                            {dangCapNhat === don._id
                              ? "ĐANG XỬ LÝ..."
                              : "✓ XÁC NHẬN ĐÃ HOÀN TIỀN"}
                          </button>
                        ) : (
                          <p style={{ color: "#9a6700", fontWeight: "600" }}>
                            Chỉ Admin mới có quyền xác nhận hoàn tiền.
                          </p>
                        )}
                      </>
                    )}

                    {don.trangThaiHoanTien === "Đã hoàn tiền" && (
                      <p
                        style={{
                          color: "#16803d",
                          fontWeight: "800",
                          margin: "12px 0 0",
                        }}
                      >
                        ✓ ĐÃ HOÀN TIỀN CHO KHÁCH HÀNG
                      </p>
                    )}
                  </div>
                )}

              {/* TRẠNG THÁI ĐƠN HÀNG */}

              <div className="donhang-cap-nhat">
                <label>TRẠNG THÁI ĐƠN HÀNG</label>

                <select
                  value={don.trangThaiDonHang || "Chờ xác nhận"}
                  disabled={dangCapNhat !== ""}
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

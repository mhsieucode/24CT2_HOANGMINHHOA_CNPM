import { useEffect, useState } from "react";
import "../App.css";

const SERVER_URL = "http://localhost:5000";

function dinhDangTien(tien) {
  return Number(tien || 0).toLocaleString("vi-VN") + " ₫";
}

function dinhDangNgay(ngay) {
  if (!ngay) return "Chưa có thông tin";

  return new Date(ngay).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function layAnh(hinhAnh) {
  if (!hinhAnh) return "/image/logo1.jpg";

  if (
    hinhAnh.startsWith("http://") ||
    hinhAnh.startsWith("https://") ||
    hinhAnh.startsWith("data:") ||
    hinhAnh.startsWith("blob:")
  ) {
    return hinhAnh;
  }

  return `${SERVER_URL}${hinhAnh.startsWith("/") ? "" : "/"}${hinhAnh}`;
}

function LichSuMuaHang({ dong }) {
  const [orders, setOrders] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangHuy, setDangHuy] = useState("");

  const taiDonHang = async () => {
    try {
      setDangTai(true);
      setLoi("");

      const response = await fetch(`${SERVER_URL}/api/orders`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải lịch sử mua hàng!");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      console.error("LỖI LỊCH SỬ MUA HÀNG:", error);
      setLoi(error.message || "Không thể kết nối đến máy chủ!");
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDonHang();
  }, []);

  const huyDonHang = async (order) => {
    const xacNhan = window.confirm(
      `Bạn có chắc chắn muốn hủy đơn hàng này không?\nMã đơn: ${order._id}`
    );

    if (!xacNhan) return;

    try {
      setDangHuy(order._id);

      const response = await fetch(
        `${SERVER_URL}/api/orders/${order._id}/cancel`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể hủy đơn hàng!");
      }

      alert(data.message || "Hủy đơn hàng thành công!");

      await taiDonHang();
    } catch (error) {
      console.error("LỖI HỦY ĐƠN:", error);
      alert(error.message || "Không thể hủy đơn hàng!");
    } finally {
      setDangHuy("");
    }
  };

  return (
    <div className="lichsu-container">
      <div className="lichsu-heading">
        <div>
          <p className="lichsu-subtitle">MH MOTO CUSTOMER</p>
          <h2>LỊCH SỬ MUA HÀNG</h2>
          <p className="lichsu-description">
            Theo dõi đơn hàng và trạng thái giao hàng của bạn.
          </p>
        </div>

        <button className="lichsu-back" onClick={dong}>
          ← Quay lại
        </button>
      </div>

      {dangTai ? (
        <div className="lichsu-message">ĐANG TẢI ĐƠN HÀNG...</div>
      ) : loi ? (
        <div className="lichsu-message lichsu-error">
          {loi}
          <button onClick={taiDonHang}>Thử tải lại</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="lichsu-empty">
          <div className="lichsu-empty-icon">🛒</div>
          <h3>BẠN CHƯA CÓ ĐƠN HÀNG</h3>
          <p>Những đơn hàng bạn đặt sẽ được hiển thị tại đây.</p>
          <button onClick={dong}>Tiếp tục mua sắm</button>
        </div>
      ) : (
        <div className="lichsu-list">
          {orders.map((order) => (
            <div className="lichsu-order" key={order._id}>
              <div className="lichsu-order-header">
                <div>
                  <span className="lichsu-label">MÃ ĐƠN HÀNG</span>
                  <strong>#{String(order._id).slice(-8).toUpperCase()}</strong>
                  <p>{dinhDangNgay(order.createdAt)}</p>
                </div>

                <span
                  className={`lichsu-status ${
                    order.trangThaiDonHang === "Đã hủy"
                      ? "status-cancelled"
                      : order.trangThaiDonHang === "Đã hoàn thành"
                      ? "status-completed"
                      : "status-pending"
                  }`}
                >
                  {order.trangThaiDonHang || "Chờ xác nhận"}
                </span>
              </div>

              <div className="lichsu-products">
                {(order.items || []).map((item, index) => (
                  <div
                    className="lichsu-product"
                    key={`${item.productId || item.tenSanPham}-${index}`}
                  >
                    <img
                      src={layAnh(item.hinhAnh)}
                      alt={item.tenSanPham}
                      onError={(event) => {
                        event.currentTarget.src = "/image/logo1.jpg";
                      }}
                    />

                    <div className="lichsu-product-info">
                      <strong>{item.tenSanPham}</strong>
                      <span>Số lượng: {item.soLuong}</span>
                    </div>

                    <strong className="lichsu-product-price">
                      {dinhDangTien(item.gia)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="lichsu-order-footer">
                <div className="lichsu-payment">
                  <p>
                    Thanh toán:{" "}
                    <strong>
                      {order.phuongThucThanhToan === "BANK_TRANSFER"
                        ? "Chuyển khoản ngân hàng"
                        : "Thanh toán khi nhận hàng"}
                    </strong>
                  </p>
                  <p>
                    Trạng thái thanh toán:{" "}
                    <strong>
                      {order.trangThaiThanhToan || "Chưa thanh toán"}
                    </strong>
                  </p>
                </div>

                <div className="lichsu-total">
                  <span>Tổng tiền</span>
                  <strong>{dinhDangTien(order.tongTien)}</strong>
                </div>
              </div>

              {order.trangThaiDonHang === "Chờ xác nhận" && (
                <div className="lichsu-actions">
                  <button
                    className="lichsu-cancel"
                    disabled={dangHuy === order._id}
                    onClick={() => huyDonHang(order)}
                  >
                    {dangHuy === order._id ? "ĐANG HỦY..." : "HỦY ĐƠN HÀNG"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LichSuMuaHang;

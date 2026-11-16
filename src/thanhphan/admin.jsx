import { useCallback, useEffect, useState } from "react";

import QuanLyDonHang from "./quanlydonhang";
import QuanLySanPham from "./quanlysanpham";

// ======================================================
// CẤU HÌNH BACKEND
// ======================================================

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

// ======================================================
// ĐỌC DỮ LIỆU SERVER
// ======================================================

async function docPhanHoi(response) {
  const noiDung = await response.text();

  if (!noiDung) return {};

  try {
    return JSON.parse(noiDung);
  } catch {
    throw new Error("Dữ liệu server trả về không hợp lệ.");
  }
}

// ======================================================
// LẤY THÔNG BÁO LỖI
// ======================================================

function layThongBaoLoi(data, macDinh) {
  return data?.message || data?.error || macDinh;
}

// ======================================================
// COMPONENT ADMIN
// ======================================================

function Admin({ user, dangXuat }) {
  // ------------------------------------------------------
  // STATE QUẢN LÝ TÀI KHOẢN
  // ------------------------------------------------------

  const [danhSachUser, setDanhSachUser] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loiTaiUser, setLoiTaiUser] = useState("");

  // ------------------------------------------------------
  // STATE ĐIỀU KHIỂN CÁC KHU VỰC
  // ------------------------------------------------------

  const [hienQuanLyUser, setHienQuanLyUser] = useState(false);
  const [hienQuanLySanPham, setHienQuanLySanPham] = useState(false);
  const [hienQuanLyDonHang, setHienQuanLyDonHang] = useState(false);
  const [hienThongKe, setHienThongKe] = useState(false);

  // ------------------------------------------------------
  // STATE THỐNG KÊ
  // ------------------------------------------------------

  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [loiThongKe, setLoiThongKe] = useState("");

  const [thongKe, setThongKe] = useState({
    tongDoanhThu: 0,
    soLuongSanPham: 0,
    soLuongBaiDang: 0,
  });

  // ID tài khoản đang đăng nhập
  const userId = String(user?._id || user?.id || "");

  // ======================================================
  // 1. LẤY DANH SÁCH TÀI KHOẢN
  // ======================================================

  const layDanhSachUser = useCallback(async () => {
    if (!userId) {
      setLoiTaiUser("Không tìm thấy thông tin người đăng nhập.");
      setDanhSachUser([]);
      return;
    }

    try {
      setDangTai(true);
      setLoiTaiUser("");

      const response = await fetch(`${API}/api/admin/users`, {
        method: "GET",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể lấy danh sách tài khoản!")
        );
      }

      const users = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      setDanhSachUser(users);
    } catch (error) {
      console.error("Lỗi lấy danh sách tài khoản:", error);
      setLoiTaiUser(error.message || "Không thể kết nối đến server.");
    } finally {
      setDangTai(false);
    }
  }, [userId]);

  // Khi mở trang Admin, tải dữ liệu nền.
  // Bảng tài khoản vẫn được ẩn cho đến khi nhấn QUẢN LÝ.

  useEffect(() => {
    layDanhSachUser();
  }, [layDanhSachUser]);

  // ======================================================
  // 2. LẤY DỮ LIỆU THỐNG KÊ
  // ======================================================

  const layThongKe = useCallback(async () => {
    if (!userId) {
      setLoiThongKe("Không tìm thấy thông tin tài khoản Admin!");
      return;
    }

    try {
      setDangTaiThongKe(true);
      setLoiThongKe("");

      const response = await fetch(`${API}/api/admin/thong-ke`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể lấy dữ liệu thống kê!")
        );
      }

      if (data?.success === false) {
        throw new Error(data.message || "Lấy dữ liệu thống kê thất bại!");
      }

      setThongKe({
        tongDoanhThu: Number(data?.tongDoanhThu) || 0,
        soLuongSanPham: Number(data?.soLuongSanPham) || 0,
        soLuongBaiDang: Number(data?.soLuongBaiDang) || 0,
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      setLoiThongKe(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTaiThongKe(false);
    }
  }, [userId]);

  // ======================================================
  // 3. MỞ / ĐÓNG THỐNG KÊ
  // ======================================================

  const moThongKe = () => {
    const trangThaiMoi = !hienThongKe;

    setHienThongKe(trangThaiMoi);

    if (trangThaiMoi) {
      layThongKe();
    }
  };

  // ======================================================
  // 4. ĐỔI QUYỀN TÀI KHOẢN
  // ======================================================

  const doiQuyen = async (id, roleMoi) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    const taiKhoanDangSua = danhSachUser.find(
      (item) => String(item._id || item.id) === String(id)
    );

    // Không cho phép Admin tự hạ quyền của mình.
    if (
      String(id) === userId &&
      taiKhoanDangSua?.role === "admin" &&
      roleMoi !== "admin"
    ) {
      alert("Bạn không thể tự hạ quyền admin của mình!");
      await layDanhSachUser();
      return;
    }

    try {
      const response = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          role: roleMoi,
        }),
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(layThongBaoLoi(data, "Không thể đổi quyền!"));
      }

      alert("Đổi quyền tài khoản thành công!");

      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi đổi quyền:", error);
      alert(error.message || "Không thể kết nối đến server!");

      await layDanhSachUser();
    }
  };

  // ======================================================
  // 5. XÓA TÀI KHOẢN
  // ======================================================

  const xoaUser = async (id, hoTen) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    // Không cho phép tự xóa tài khoản đang đăng nhập.
    if (String(id) === userId) {
      alert("Bạn không thể tự xóa tài khoản đang đăng nhập!");
      return;
    }

    const xacNhan = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${hoTen || "này"}" không?`
    );

    if (!xacNhan) return;

    try {
      const response = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(layThongBaoLoi(data, "Không thể xóa tài khoản!"));
      }

      alert("Xóa tài khoản thành công!");

      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      alert(error.message || "Không thể kết nối đến server!");
    }
  };

  // ======================================================
  // 6. HIỂN THỊ TÊN QUYỀN
  // ======================================================

  const hienThiRole = (role) => {
    if (role === "admin") return "ADMIN";
    if (role === "staff") return "NHÂN VIÊN";

    return "KHÁCH HÀNG";
  };

  // ======================================================
  // 7. GIAO DIỆN ADMIN
  // ======================================================

  return (
    <div className="admin-page">
      {/* HEADER ADMIN */}

      <div className="admin-header">
        <div>
          <h1>ADMIN</h1>

          <p>
            Xin chào, <strong>{user?.hoTen || "Admin"}</strong>
          </p>

          <p>Quyền: ADMIN</p>
        </div>

        <button type="button" className="admin-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* CÁC THẺ CHỨC NĂNG QUẢN TRỊ */}

      <div className="admin-menu">
        {/* THẺ QUẢN LÝ TÀI KHOẢN */}

        <div className="admin-card">
          <div className="admin-icon">👤</div>

          <h2>Quản lý tài khoản</h2>

          <button type="button" onClick={() => setHienQuanLyUser((cu) => !cu)}>
            {hienQuanLyUser ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        {/* THẺ QUẢN LÝ SẢN PHẨM */}

        <div className="admin-card">
          <div className="admin-icon">📦</div>

          <h2>Quản lý sản phẩm</h2>

          <button
            type="button"
            onClick={() => setHienQuanLySanPham((cu) => !cu)}
          >
            {hienQuanLySanPham ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        {/* THẺ QUẢN LÝ ĐƠN HÀNG */}

        <div className="admin-card">
          <div className="admin-icon">🛒</div>

          <h2>Quản lý đơn hàng</h2>

          <button
            type="button"
            onClick={() => setHienQuanLyDonHang((cu) => !cu)}
          >
            {hienQuanLyDonHang ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        {/* THẺ THỐNG KÊ WEBSITE */}

        <div className="admin-card">
          <div className="admin-icon">📊</div>

          <h2>Thống kê</h2>

          <button type="button" onClick={moThongKe}>
            {hienThongKe ? "ĐÓNG THỐNG KÊ" : "XEM THỐNG KÊ"}
          </button>
        </div>
      </div>

      {/* ==================================================
          KHU VỰC QUẢN LÝ SẢN PHẨM
      ================================================== */}

      {hienQuanLySanPham && (
        <div className="admin-products">
          <QuanLySanPham dong={() => setHienQuanLySanPham(false)} />
        </div>
      )}

      {/* ==================================================
          KHU VỰC QUẢN LÝ ĐƠN HÀNG
      ================================================== */}

      {hienQuanLyDonHang && (
        <div className="admin-orders">
          <QuanLyDonHang />
        </div>
      )}

      {/* ==================================================
          KHU VỰC THỐNG KÊ WEBSITE
      ================================================== */}

      {hienThongKe && (
        <div className="admin-statistics">
          <div className="admin-statistics-header">
            <div>
              <h2>THỐNG KÊ WEBSITE MH MOTO</h2>

              <p>Tổng hợp dữ liệu hoạt động của website.</p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={layThongKe}
              disabled={dangTaiThongKe}
            >
              {dangTaiThongKe ? "ĐANG TẢI..." : "🔄 LÀM MỚI"}
            </button>
          </div>

          {dangTaiThongKe ? (
            <div className="admin-loading">Đang tải dữ liệu thống kê...</div>
          ) : loiThongKe ? (
            <div className="admin-statistics-error">
              {loiThongKe}

              <button type="button" onClick={layThongKe}>
                THỬ LẠI
              </button>
            </div>
          ) : (
            <div className="admin-statistics-grid">
              {/* TỔNG DOANH THU */}

              <div className="admin-stat-card">
                <div className="admin-stat-icon">💰</div>

                <div>
                  <p>TỔNG DOANH THU</p>

                  <h3>{thongKe.tongDoanhThu.toLocaleString("vi-VN")} đ</h3>

                  <span>Đơn hàng đã hoàn thành</span>
                </div>
              </div>

              {/* SỐ LƯỢNG SẢN PHẨM */}

              <div className="admin-stat-card">
                <div className="admin-stat-icon">🏍️</div>

                <div>
                  <p>SỐ LƯỢNG SẢN PHẨM</p>

                  <h3>{thongKe.soLuongSanPham}</h3>

                  <span>Tổng sản phẩm trong hệ thống</span>
                </div>
              </div>

              {/* SỐ LƯỢNG BÀI ĐĂNG */}

              <div className="admin-stat-card">
                <div className="admin-stat-icon">📝</div>

                <div>
                  <p>SỐ BÀI ĐĂNG SẢN PHẨM</p>

                  <h3>{thongKe.soLuongBaiDang}</h3>

                  <span>Tổng sản phẩm đã đăng bán</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          KHU VỰC QUẢN LÝ TÀI KHOẢN
          Chỉ hiển thị khi nhấn nút QUẢN LÝ
      ================================================== */}

      {hienQuanLyUser && (
        <div className="admin-users">
          <div className="admin-users-header">
            <div>
              <h2>QUẢN LÝ TÀI KHOẢN</h2>

              <p>
                Tổng số tài khoản: <strong>{danhSachUser.length}</strong>
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={layDanhSachUser}
              disabled={dangTai}
            >
              {dangTai ? "ĐANG TẢI..." : "🔄 LÀM MỚI"}
            </button>
          </div>

          {/* THÔNG BÁO LỖI */}

          {loiTaiUser && (
            <div className="admin-statistics-error">
              {loiTaiUser}

              <button type="button" onClick={layDanhSachUser}>
                THỬ LẠI
              </button>
            </div>
          )}

          {/* TRẠNG THÁI TẢI DỮ LIỆU */}

          {dangTai ? (
            <div className="admin-loading">Đang tải danh sách tài khoản...</div>
          ) : danhSachUser.length === 0 ? (
            <div className="admin-loading">
              Chưa có tài khoản nào để hiển thị.
            </div>
          ) : (
            /* BẢNG DANH SÁCH TÀI KHOẢN */

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>HỌ TÊN</th>
                    <th>EMAIL</th>
                    <th>QUYỀN</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>

                <tbody>
                  {danhSachUser.map((item, index) => (
                    <tr key={item._id || item.id || item.email || index}>
                      <td>{index + 1}</td>

                      <td>{item.hoTen || "Chưa cập nhật"}</td>

                      <td>{item.email || "Chưa có email"}</td>

                      {/* NHÃN QUYỀN */}

                      <td>
                        <span className={`role-badge role-${item.role}`}>
                          {hienThiRole(item.role)}
                        </span>
                      </td>

                      {/* THAY ĐỔI QUYỀN VÀ XÓA USER */}

                      <td>
                        <div className="admin-actions">
                          <select
                            aria-label={`Quyền của ${item.hoTen || item.email}`}
                            value={item.role || "customer"}
                            disabled={
                              String(item._id || item.id) === userId &&
                              item.role === "admin"
                            }
                            onChange={(e) =>
                              doiQuyen(item._id || item.id, e.target.value)
                            }
                          >
                            <option value="customer">Khách hàng</option>

                            <option value="staff">Nhân viên</option>

                            <option value="admin">Admin</option>
                          </select>

                          <button
                            type="button"
                            className="delete-user"
                            disabled={String(item._id || item.id) === userId}
                            onClick={() =>
                              xoaUser(item._id || item.id, item.hoTen)
                            }
                          >
                            XÓA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;

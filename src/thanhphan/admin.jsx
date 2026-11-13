import { useEffect, useState } from "react";
import QuanLyDonHang from "./quanlydonhang";

function Admin({ user, dangXuat, dongMoQuanLySanPham }) {
  // ======================================
  // QUẢN LÝ TÀI KHOẢN
  // ======================================

  const [danhSachUser, setDanhSachUser] = useState([]);
  const [dangTai, setDangTai] = useState(false);

  // ======================================
  // QUẢN LÝ ĐƠN HÀNG
  // ======================================

  const [hienQuanLyDonHang, setHienQuanLyDonHang] = useState(false);

  // ======================================
  // QUẢN LÝ THỐNG KÊ
  // ======================================

  const [hienThongKe, setHienThongKe] = useState(false);
  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [loiThongKe, setLoiThongKe] = useState("");

  const [thongKe, setThongKe] = useState({
    tongDoanhThu: 0,
    soLuongSanPham: 0,
    soLuongBaiDang: 0,
  });

  // ID TÀI KHOẢN ĐANG ĐĂNG NHẬP
  const userId = String(user?.id || user?._id || "");

  // ======================================
  // LẤY DANH SÁCH TÀI KHOẢN
  // ======================================

  const layDanhSachUser = async () => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    try {
      setDangTai(true);

      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể lấy danh sách tài khoản!");
        return;
      }

      setDanhSachUser(data.users || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách tài khoản:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      setDangTai(false);
    }
  };

  // ======================================
  // LẤY DỮ LIỆU THỐNG KÊ TỪ BACKEND
  // ======================================

  const layThongKe = async () => {
    if (!userId) {
      setLoiThongKe("Không tìm thấy thông tin tài khoản Admin!");
      return;
    }

    try {
      setDangTaiThongKe(true);
      setLoiThongKe("");

      const response = await fetch("http://localhost:5000/api/admin/thong-ke", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lấy dữ liệu thống kê!");
      }

      if (!data.success) {
        throw new Error(data.message || "Lấy dữ liệu thống kê thất bại!");
      }

      setThongKe({
        tongDoanhThu: Number(data.tongDoanhThu) || 0,
        soLuongSanPham: Number(data.soLuongSanPham) || 0,
        soLuongBaiDang: Number(data.soLuongBaiDang) || 0,
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      setLoiThongKe(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTaiThongKe(false);
    }
  };

  // ======================================
  // MỞ / ĐÓNG THỐNG KÊ
  // ======================================

  const moThongKe = async () => {
    const trangThaiMoi = !hienThongKe;

    setHienThongKe(trangThaiMoi);

    if (trangThaiMoi) {
      await layThongKe();
    }
  };

  // ======================================
  // TỰ ĐỘNG LẤY DANH SÁCH TÀI KHOẢN
  // ======================================

  useEffect(() => {
    if (userId) {
      layDanhSachUser();
    }
  }, [userId]);

  // ======================================
  // ĐỔI QUYỀN TÀI KHOẢN
  // ======================================

  const doiQuyen = async (id, roleMoi) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    const taiKhoanDangSua = danhSachUser.find(
      (item) => String(item._id) === String(id)
    );

    // KHÔNG CHO ADMIN TỰ HẠ QUYỀN
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
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            role: roleMoi,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể đổi quyền!");
        await layDanhSachUser();
        return;
      }

      alert("Đổi quyền thành công!");

      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi đổi quyền:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  // ======================================
  // XÓA TÀI KHOẢN
  // ======================================

  const xoaUser = async (id, hoTen) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    if (String(id) === userId) {
      alert("Bạn không thể tự xóa tài khoản đang đăng nhập!");
      return;
    }

    const xacNhan = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${hoTen}" không?`
    );

    if (!xacNhan) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${id}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": userId,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể xóa tài khoản!");
        return;
      }

      alert("Xóa tài khoản thành công!");

      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  // ======================================
  // HIỂN THỊ QUYỀN
  // ======================================

  const hienThiRole = (role) => {
    if (role === "admin") return "ADMIN";
    if (role === "staff") return "NHÂN VIÊN";

    return "KHÁCH HÀNG";
  };

  // ======================================
  // GIAO DIỆN ADMIN
  // ======================================

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>ADMIN</h1>

          <p>
            Xin chào, <strong>{user?.hoTen || "Admin"}</strong>
          </p>

          <p>Quyền: ADMIN</p>
        </div>

        <button className="admin-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* MENU ADMIN */}
      <div className="admin-menu">
        {/* QUẢN LÝ TÀI KHOẢN */}
        <div className="admin-card">
          <div className="admin-icon">👤</div>

          <h2>Quản lý tài khoản</h2>

          <p>Quản lý khách hàng, nhân viên và tài khoản hệ thống.</p>
        </div>

        {/* QUẢN LÝ SẢN PHẨM */}
        <div className="admin-card">
          <div className="admin-icon">📦</div>

          <h2>Quản lý sản phẩm</h2>

          <p>Thêm, sửa, xóa và cập nhật sản phẩm.</p>

          <button onClick={dongMoQuanLySanPham}>QUẢN LÝ</button>
        </div>

        {/* QUẢN LÝ ĐƠN HÀNG */}
        <div className="admin-card">
          <div className="admin-icon">🛒</div>

          <h2>Quản lý đơn hàng</h2>

          <p>Xem và quản lý đơn hàng của khách hàng.</p>

          <button onClick={() => setHienQuanLyDonHang(!hienQuanLyDonHang)}>
            {hienQuanLyDonHang ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        {/* THỐNG KÊ */}
        <div className="admin-card">
          <div className="admin-icon">📊</div>

          <h2>Thống kê</h2>

          <p>Xem tổng doanh thu, số lượng sản phẩm và bài đăng.</p>

          <button onClick={moThongKe}>
            {hienThongKe ? "ĐÓNG THỐNG KÊ" : "XEM THỐNG KÊ"}
          </button>
        </div>
      </div>

      {/* ======================================
          KHU VỰC THỐNG KÊ
      ====================================== */}

      {hienThongKe && (
        <div className="admin-statistics">
          <div className="admin-statistics-header">
            <div>
              <h2>THỐNG KÊ WEBSITE MH MOTO</h2>
              <p>Tổng hợp dữ liệu hoạt động của website.</p>
            </div>

            <button
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
              <button onClick={layThongKe}>THỬ LẠI</button>
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

      {/* ======================================
          QUẢN LÝ ĐƠN HÀNG
      ====================================== */}

      {hienQuanLyDonHang && (
        <div className="admin-orders">
          <QuanLyDonHang />
        </div>
      )}

      {/* ======================================
          QUẢN LÝ TÀI KHOẢN
      ====================================== */}

      <div className="admin-users">
        <div className="admin-users-header">
          <div>
            <h2>QUẢN LÝ TÀI KHOẢN</h2>

            <p>
              Tổng số tài khoản: <strong>{danhSachUser.length}</strong>
            </p>
          </div>

          <button
            className="admin-refresh"
            onClick={layDanhSachUser}
            disabled={dangTai}
          >
            {dangTai ? "ĐANG TẢI..." : "🔄 LÀM MỚI"}
          </button>
        </div>

        {dangTai ? (
          <div className="admin-loading">Đang tải danh sách tài khoản...</div>
        ) : danhSachUser.length === 0 ? (
          <div className="admin-loading">
            Chưa có tài khoản nào hoặc không thể tải danh sách.
          </div>
        ) : (
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
                  <tr key={item._id}>
                    <td>{index + 1}</td>

                    <td>{item.hoTen}</td>

                    <td>{item.email}</td>

                    <td>
                      <span className={`role-badge role-${item.role}`}>
                        {hienThiRole(item.role)}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <select
                          value={item.role}
                          disabled={
                            String(item._id) === userId && item.role === "admin"
                          }
                          onChange={(e) => doiQuyen(item._id, e.target.value)}
                        >
                          <option value="customer">Khách hàng</option>
                          <option value="staff">Nhân viên</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          className="delete-user"
                          disabled={String(item._id) === userId}
                          onClick={() => xoaUser(item._id, item.hoTen)}
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
    </div>
  );
}

export default Admin;

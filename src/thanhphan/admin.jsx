import { useEffect, useState } from "react";

function Admin({ user, dangXuat }) {
  const [danhSachUser, setDanhSachUser] = useState([]);
  const [dangTai, setDangTai] = useState(false);

  // =========================
  // LẤY DANH SÁCH USER
  // =========================

  const layDanhSachUser = async () => {
    try {
      setDangTai(true);

      const response = await fetch("http://localhost:5000/api/admin/users");

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể lấy danh sách tài khoản!");
        return;
      }

      setDanhSachUser(data.users);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    layDanhSachUser();
  }, []);

  // =========================
  // ĐỔI QUYỀN
  // =========================

  const doiQuyen = async (id, roleMoi) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: roleMoi,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể đổi quyền!");
        return;
      }

      alert("Đổi quyền thành công!");

      layDanhSachUser();
    } catch (error) {
      console.error("Lỗi đổi quyền:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  // =========================
  // XÓA USER
  // =========================

  const xoaUser = async (id, hoTen) => {
    const xacNhan = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${hoTen}" không?`
    );

    if (!xacNhan) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể xóa tài khoản!");
        return;
      }

      alert("Xóa tài khoản thành công!");

      layDanhSachUser();
    } catch (error) {
      console.error("Lỗi xóa user:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  // =========================
  // HIỂN THỊ ROLE
  // =========================

  const hienThiRole = (role) => {
    if (role === "admin") {
      return "ADMIN";
    }

    if (role === "staff") {
      return "NHÂN VIÊN";
    }

    return "KHÁCH HÀNG";
  };

  return (
    <div className="admin-page">
      {/* =========================
          HEADER
      ========================= */}

      <div className="admin-header">
        <div>
          <h1>ADMIN DASHBOARD</h1>

          <p>
            Xin chào, <strong>{user?.hoTen}</strong>
          </p>
        </div>

        <button className="admin-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* =========================
          MENU ADMIN
      ========================= */}

      <div className="admin-menu">
        <div className="admin-card">
          <div className="admin-icon">👤</div>

          <h2>Quản lý tài khoản</h2>

          <p>Quản lý khách hàng, nhân viên và tài khoản hệ thống.</p>
        </div>

        <div className="admin-card">
          <div className="admin-icon">📦</div>

          <h2>Quản lý sản phẩm</h2>

          <p>Thêm, sửa, xóa và cập nhật sản phẩm.</p>

          <button>QUẢN LÝ</button>
        </div>

        <div className="admin-card">
          <div className="admin-icon">🛒</div>

          <h2>Quản lý đơn hàng</h2>

          <p>Xem và quản lý đơn hàng của khách hàng.</p>

          <button>QUẢN LÝ</button>
        </div>

        <div className="admin-card">
          <div className="admin-icon">📊</div>

          <h2>Thống kê</h2>

          <p>Xem doanh thu và tình hình hoạt động.</p>

          <button>XEM THỐNG KÊ</button>
        </div>
      </div>

      {/* =========================
          QUẢN LÝ TÀI KHOẢN
      ========================= */}

      <div className="admin-users">
        <div className="admin-users-header">
          <div>
            <h2>QUẢN LÝ TÀI KHOẢN</h2>

            <p>
              Tổng số tài khoản: <strong>{danhSachUser.length}</strong>
            </p>
          </div>

          <button className="admin-refresh" onClick={layDanhSachUser}>
            🔄 LÀM MỚI
          </button>
        </div>

        {dangTai ? (
          <div className="admin-loading">Đang tải danh sách tài khoản...</div>
        ) : danhSachUser.length === 0 ? (
          <div className="admin-loading">Chưa có tài khoản nào.</div>
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
                          onChange={(e) => doiQuyen(item._id, e.target.value)}
                        >
                          <option value="customer">Khách hàng</option>

                          <option value="staff">Nhân viên</option>

                          <option value="admin">Admin</option>
                        </select>

                        <button
                          className="delete-user"
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

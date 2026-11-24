import { useEffect, useMemo, useState } from "react";
import "../App.css";

const SERVER_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API = `${SERVER_URL}/api/staff/customers`;

function QuanLyKhachHang({ dong }) {
  const [khachHang, setKhachHang] = useState([]);
  const [tuKhoa, setTuKhoa] = useState("");
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    let conHoatDong = true;

    const layDanhSachKhachHang = async () => {
      try {
        setDangTai(true);
        setLoi("");

        const response = await fetch(API, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              (response.status === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!"
                : response.status === 403
                ? "Bạn không có quyền xem danh sách khách hàng!"
                : "Không thể tải danh sách khách hàng!")
          );
        }

        if (conHoatDong) {
          setKhachHang(data.customers || []);
        }
      } catch (error) {
        if (conHoatDong) {
          setLoi(error.message || "Có lỗi xảy ra khi tải dữ liệu!");
        }
      } finally {
        if (conHoatDong) {
          setDangTai(false);
        }
      }
    };

    layDanhSachKhachHang();

    return () => {
      conHoatDong = false;
    };
  }, []);

  const danhSachLoc = useMemo(() => {
    const tuKhoaTim = tuKhoa.trim().toLowerCase();

    if (!tuKhoaTim) return khachHang;

    return khachHang.filter((kh) => {
      const hoTen = (kh.hoTen || "").toLowerCase();
      const email = (kh.email || "").toLowerCase();

      return hoTen.includes(tuKhoaTim) || email.includes(tuKhoaTim);
    });
  }, [khachHang, tuKhoa]);

  const dinhDangNgay = (ngay) => {
    if (!ngay) return "Chưa cập nhật";

    const date = new Date(ngay);

    if (Number.isNaN(date.getTime())) {
      return "Chưa cập nhật";
    }

    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="qlkh-container">
      <div className="qlkh-header">
        <div>
          <h2>QUẢN LÝ KHÁCH HÀNG</h2>
          <p>Danh sách khách hàng của hệ thống MH MOTO</p>
        </div>

        {typeof dong === "function" && (
          <button className="qlkh-back" onClick={dong}>
            ← QUAY LẠI DASHBOARD
          </button>
        )}
      </div>

      <div className="qlkh-summary">
        <div className="qlkh-summary-card">
          <span>TỔNG SỐ KHÁCH HÀNG</span>
          <strong>{khachHang.length}</strong>
        </div>

        <div className="qlkh-summary-card">
          <span>KẾT QUẢ TÌM KIẾM</span>
          <strong>{danhSachLoc.length}</strong>
        </div>
      </div>

      <div className="qlkh-toolbar">
        <input
          type="text"
          placeholder="Tìm theo họ tên hoặc email..."
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>

      {dangTai ? (
        <div className="qlkh-message">Đang tải danh sách khách hàng...</div>
      ) : loi ? (
        <div className="qlkh-error">
          <p>{loi}</p>
          <button onClick={() => window.location.reload()}>
            TẢI LẠI TRANG
          </button>
        </div>
      ) : danhSachLoc.length === 0 ? (
        <div className="qlkh-message">
          {khachHang.length === 0
            ? "Chưa có khách hàng nào trong hệ thống."
            : "Không tìm thấy khách hàng phù hợp."}
        </div>
      ) : (
        <div className="qlkh-table-wrapper">
          <table className="qlkh-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>HỌ VÀ TÊN</th>
                <th>EMAIL</th>
                <th>NGÀY ĐĂNG KÝ</th>
                <th>LOẠI TÀI KHOẢN</th>
              </tr>
            </thead>

            <tbody>
              {danhSachLoc.map((kh, index) => (
                <tr key={kh._id}>
                  <td>{index + 1}</td>
                  <td>{kh.hoTen || "Chưa cập nhật"}</td>
                  <td>{kh.email || "Chưa cập nhật"}</td>
                  <td>{dinhDangNgay(kh.createdAt)}</td>
                  <td>
                    <span className="qlkh-badge">Khách hàng</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="qlkh-note">
        Nhân viên chỉ được xem thông tin cần thiết để hỗ trợ khách hàng. Không
        được thay đổi quyền hoặc xóa tài khoản.
      </p>
    </div>
  );
}

export default QuanLyKhachHang;

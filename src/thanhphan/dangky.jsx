import { useState } from "react";

function DangKy({ dong, sangDangNhap }) {
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");

  const xuLyDangKy = async (e) => {
    e.preventDefault();

    // Kiểm tra bỏ trống
    if (!hoTen || !email || !matKhau || !nhapLaiMatKhau) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Kiểm tra mật khẩu
    if (matKhau !== nhapLaiMatKhau) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      // Gửi dữ liệu đăng ký lên backend
      const response = await fetch("http://localhost:5000/api/dang-ky", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hoTen: hoTen,
          email: email,
          matKhau: matKhau,
        }),
      });

      const data = await response.json();

      // Nếu backend báo lỗi
      if (!response.ok) {
        alert(data.message || "Đăng ký thất bại!");
        return;
      }

      // Đăng ký thành công
      alert("Đăng ký thành công!");

      // Xóa dữ liệu trong form
      setHoTen("");
      setEmail("");
      setMatKhau("");
      setNhapLaiMatKhau("");

      // Đóng form đăng ký
      dong();

      // Chuyển sang form đăng nhập
      sangDangNhap();
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        <button className="close-auth" onClick={dong}>
          ×
        </button>

        <h2>ĐĂNG KÝ</h2>
        <p>Tạo tài khoản MOTO SHOP</p>

        <form onSubmit={xuLyDangKy}>
          <input
            type="text"
            placeholder="Họ và tên"
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
          />

          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={nhapLaiMatKhau}
            onChange={(e) => setNhapLaiMatKhau(e.target.value)}
          />

          <button type="submit" className="auth-submit">
            ĐĂNG KÝ
          </button>
        </form>

        <div className="auth-change">
          Đã có tài khoản?
          <span onClick={sangDangNhap}>Đăng nhập</span>
        </div>
      </div>
    </div>
  );
}

export default DangKy;

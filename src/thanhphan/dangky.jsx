import { useState } from "react";

function DangKy({ dong, sangDangNhap }) {
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [nhapLaiMatKhau, setNhapLaiMatKhau] = useState("");

  const xuLyDangKy = (e) => {
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

    // Lưu tài khoản
    const taiKhoan = {
      hoTen: hoTen,
      email: email,
      matKhau: matKhau,
    };

    localStorage.setItem("taiKhoan", JSON.stringify(taiKhoan));

    // Thông báo
    alert("Đăng ký thành công!");

    // Xóa dữ liệu
    setHoTen("");
    setEmail("");
    setMatKhau("");
    setNhapLaiMatKhau("");

    // Chuyển sang đăng nhập
    dong();
    sangDangNhap();
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

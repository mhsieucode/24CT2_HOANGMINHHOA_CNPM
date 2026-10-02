import { useState } from "react";

function DangNhap({ dong, sangDangKy }) {
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");

  const xuLyDangNhap = (e) => {
    e.preventDefault();

    // Kiểm tra bỏ trống
    if (!email || !matKhau) {
      alert("Vui lòng nhập email và mật khẩu!");
      return;
    }

    // Lấy tài khoản đã đăng ký
    const taiKhoan = JSON.parse(localStorage.getItem("taiKhoan"));

    // Chưa có tài khoản
    if (!taiKhoan) {
      alert("Bạn chưa có tài khoản. Vui lòng đăng ký!");
      return;
    }

    // Kiểm tra tài khoản
    if (email === taiKhoan.email && matKhau === taiKhoan.matKhau) {
      alert(`Đăng nhập thành công! Chào mừng ${taiKhoan.hoTen}`);

      setEmail("");
      setMatKhau("");

      dong();
    } else {
      alert("Email hoặc mật khẩu không chính xác!");
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        <button className="close-auth" onClick={dong}>
          ×
        </button>

        <h2>ĐĂNG NHẬP</h2>

        <p>Chào mừng bạn đến với MOTO SHOP</p>

        <form onSubmit={xuLyDangNhap}>
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

          <button type="submit" className="auth-submit">
            ĐĂNG NHẬP
          </button>
        </form>

        <div className="auth-change">
          Chưa có tài khoản?
          <span onClick={sangDangKy}>Đăng ký</span>
        </div>
      </div>
    </div>
  );
}

export default DangNhap;

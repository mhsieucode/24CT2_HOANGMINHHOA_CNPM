import { useState } from "react";

function DangNhap({ dong, sangDangKy, dangNhapThanhCong }) {
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");

  const xuLyDangNhap = async (e) => {
    e.preventDefault();

    if (!email || !matKhau) {
      alert("Vui lòng nhập email và mật khẩu!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/dang-nhap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          matKhau: matKhau,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Đăng nhập thất bại!");
        return;
      }

      // Lưu thông tin người dùng, bao gồm cả role
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Người đăng nhập:", data.user);
      console.log("Role:", data.user.role);

      alert("Đăng nhập thành công!");

      setEmail("");
      setMatKhau("");

      // Đóng popup
      dong();

      // Báo cho App biết đã đăng nhập
      if (dangNhapThanhCong) {
        dangNhapThanhCong(data.user);
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Không thể kết nối đến server!");
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        <button className="close-auth" onClick={dong}>
          ×
        </button>

        <h2>ĐĂNG NHẬP</h2>

        <p>Chào mừng bạn trở lại MOTO SHOP</p>

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

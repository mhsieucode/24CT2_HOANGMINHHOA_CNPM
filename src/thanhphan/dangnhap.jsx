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

      // LƯU THÔNG TIN NGƯỜI DÙNG
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Người đăng nhập:", data.user);
      console.log("Role:", data.user.role);

      alert("Đăng nhập thành công!");

      setEmail("");
      setMatKhau("");

      // ĐÓNG POPUP
      dong();

      // CẬP NHẬT TRẠNG THÁI ĐĂNG NHẬP
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
        {/* NÚT ĐÓNG */}
        <button className="close-auth" onClick={dong}>
          ×
        </button>

        {/* LOGO */}
        <div className="auth-logo">
          <span className="auth-mh">MH</span>
          <span className="auth-moto"> MOTO</span>
        </div>

        <div className="auth-line"></div>

        {/* TIÊU ĐỀ */}
        <h2>ĐĂNG NHẬP</h2>

        <p className="auth-subtitle">WELCOME MHMOTO</p>

        {/* FORM ĐĂNG NHẬP */}
        <form onSubmit={xuLyDangNhap}>
          <input
            type="email"
            placeholder="EMAIL CỦA BẠN"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="MẬT KHẨU"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
          />

          <button type="submit" className="auth-submit">
            Đăng Nhập
          </button>
        </form>

        {/* ĐĂNG KÝ */}
        <div className="auth-change">
          Chưa có tài khoản?
          <span onClick={sangDangKy}> Đăng ký ngay</span>
        </div>
      </div>
    </div>
  );
}

export default DangNhap;

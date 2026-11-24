import { useState } from "react";

function DangNhap({ dong, sangDangKy, dangNhapThanhCong }) {
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);

  const xuLyDangNhap = async (e) => {
    e.preventDefault();

    if (!email.trim() || !matKhau) {
      alert("Vui lòng nhập email và mật khẩu!");
      return;
    }

    if (dangXuLy) return;

    try {
      setDangXuLy(true);

      const response = await fetch("http://localhost:5000/api/dang-nhap", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          matKhau,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Đăng nhập thất bại!");
        return;
      }

      if (!data.user) {
        alert("Server không trả về thông tin tài khoản!");
        return;
      }

      // Chỉ lưu thông tin hiển thị, KHÔNG lưu JWT
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Đăng nhập thành công:", data.user);
      console.log("Role:", data.user.role);

      // Cập nhật trạng thái đăng nhập trong App
      if (typeof dangNhapThanhCong === "function") {
        dangNhapThanhCong(data.user);
      }

      setEmail("");
      setMatKhau("");

      alert("Đăng nhập thành công!");

      // Đóng popup
      if (typeof dong === "function") {
        dong();
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Không thể kết nối đến server!");
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        {/* NÚT ĐÓNG */}
        <button className="close-auth" onClick={dong} type="button">
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
            autoComplete="email"
            required
          />

          <input
            type="password"
            placeholder="MẬT KHẨU"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" className="auth-submit" disabled={dangXuLy}>
            {dangXuLy ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
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

function DauTrang({ user, setHienDangNhap, setHienDangKy, xuLyDangXuat }) {
  return (
    <nav className="navbar">
      {/* LOGO */}
      <div className="logo">
        <img src="/image/logo1.jpg" alt="MOTO SHOP" />
        <span>MOTO SHOP</span>
      </div>

      {/* MENU */}
      <div className="nav-menu">
        <a href="#trangchu">Trang chủ</a>
        <a href="#sanpham">Sản phẩm</a>
        <a href="#gioithieu">Giới thiệu</a>
        <a href="#lienhe">Liên hệ</a>
        <a href="#giohang">🛒 Giỏ hàng</a>

        {/* ĐĂNG NHẬP / ĐĂNG KÝ */}
        {!user ? (
          <div className="auth-buttons">
            <button className="login-btn" onClick={() => setHienDangNhap(true)}>
              ĐĂNG NHẬP
            </button>

            <button
              className="register-btn"
              onClick={() => setHienDangKy(true)}
            >
              ĐĂNG KÝ
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <span className="welcome-user">
              Xin chào, <strong>{user.hoTen}</strong>
            </span>

            <button className="logout-btn" onClick={xuLyDangXuat}>
              ĐĂNG XUẤT
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default DauTrang;

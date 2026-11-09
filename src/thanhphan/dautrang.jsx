function DauTrang({
  user,
  setHienDangNhap,
  setHienDangKy,
  xuLyDangXuat,
  moGioHang,
  dongGioHang,
}) {
  const veTrang = (id) => {
    dongGioHang();
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src="/image/logo1.jpg" alt="MOTO SHOP" />
        <span>MOTO SHOP</span>
      </div>

      <div className="nav-menu">
        <a href="#trangchu" onClick={() => veTrang("trangchu")}>
          Trang chủ
        </a>

        <a href="#sanpham" onClick={() => veTrang("sanpham")}>
          Sản phẩm
        </a>

        <a href="#gioithieu" onClick={() => veTrang("gioithieu")}>
          Giới thiệu
        </a>

        <a href="#lienhe" onClick={() => veTrang("lienhe")}>
          Liên hệ
        </a>

        <button className="cart-btn" onClick={moGioHang}>
          🛒 Giỏ hàng
        </button>

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

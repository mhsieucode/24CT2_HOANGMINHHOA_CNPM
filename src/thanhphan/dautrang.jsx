function DauTrang() {
  return (
    <header className="header">
      {/* LOGO */}
      <div className="logo">
        <img src="/image/bgr.jpg" alt="Moto Shop" />
        <span>MOTO SHOP</span>
      </div>

      {/* MENU */}
      <nav>
        <a href="#">Trang chủ</a>
        <a href="#sanpham">Sản phẩm</a>
        <a href="#gioithieu">Giới thiệu</a>
        <a href="#lienhe">Liên hệ</a>
      </nav>

      {/* GIỎ HÀNG */}
      <div className="cart">🛒 Giỏ hàng</div>
    </header>
  );
}

export default DauTrang;

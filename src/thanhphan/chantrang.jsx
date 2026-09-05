function ChanTrang() {
  return (
    <footer className="footer" id="lienhe">
      <div className="footer-top">
        {/* LOGO + GIỚI THIỆU */}
        <div className="footer-brand">
          <h2>🏍️ MOTO SHOP</h2>
          <p>Đam mê tốc độ - Đồng hành cùng biker.</p>
        </div>

        {/* THÔNG TIN */}
        <div className="footer-info">
          <h3>THÔNG TIN</h3>
          <p>📍 Đà Nẵng, Việt Nam</p>
          <p>🕐 08:00 - 22:00</p>
          <p>📞 0905 123 456</p>
          <p>📧 motoshop@gmail.com</p>
        </div>

        {/* LIÊN KẾT */}
        <div className="footer-links">
          <h3>LIÊN KẾT</h3>
          <a href="#sanpham">Sản phẩm</a>
          <a href="#gioithieu">Giới thiệu</a>
          <a href="#danhgia">Đánh giá</a>
          <a href="#lienhe">Liên hệ</a>
        </div>
      </div>

      {/* ẢNH + BẢN ĐỒ */}
      <div className="contact-media">
        <div className="contact-photo">
          <h3>📸 MOTO SHOP</h3>
          <img src="/image/bgr.jpg" alt="Moto Shop" />
        </div>

        <div className="contact-map">
          <h3>📍 VỊ TRÍ SHOP</h3>
          <iframe
            src="https://www.google.com/maps?q=Da%20Nang%2C%20Vietnam&output=embed"
            title="Bản đồ Moto Shop"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      {/* FOOTER CUỐI */}
      <div className="footer-bottom">
        <span>© 2026 MOTO SHOP</span>
        <span>Website bán xe & phụ kiện mô tô</span>
      </div>
    </footer>
  );
}

export default ChanTrang;

function GioiThieu() {
  return (
    <section className="about" id="gioithieu">
      {/* TIÊU ĐỀ */}
      <div className="about-title">
        <h2>VỀ MOTO SHOP</h2>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="about-container">
        {/* ẢNH */}
        <div className="about-image">
          <img src="/image/logo1.jpg" alt="Moto Shop" />
        </div>

        {/* NỘI DUNG */}
        <div className="about-content">
          <p>
            <strong>MH MOTO</strong> – điểm đến dành cho những tín đồ đam mê tốc
            độ, yêu thích sự mạnh mẽ và phong cách của những chiếc xe moto.
          </p>

          <p>
            Chúng tôi mang đến đa dạng sản phẩm từ
            <strong>
              {" "}
              xe moto, nón bảo hiểm, áo moto, giáp bảo hộ, phụ tùng, bánh xe{" "}
            </strong>
            và các phụ kiện chất lượng dành cho mọi biker.
          </p>

          <p>
            <strong>MH MOTO</strong> không chỉ là nơi mua sắm, mà còn là nơi
            khơi nguồn đam mê, khẳng định cá tính và đồng hành cùng bạn trên mọi
            cung đường.
          </p>

          <button className="about-button">KHÁM PHÁ SẢN PHẨM</button>
        </div>
      </div>

      {/* CÁC ĐIỂM NỔI BẬT */}
      <div className="about-features">
        <div className="about-feature">
          <div className="feature-icon">🛡️</div>
          <h3>CHẤT LƯỢNG</h3>
          <p>Sản phẩm được lựa chọn kỹ càng, đảm bảo chất lượng.</p>
        </div>

        <div className="about-feature">
          <div className="feature-icon">🏍️</div>
          <h3>ĐA DẠNG</h3>
          <p>Nhiều loại phụ kiện dành cho biker và người đi mô tô.</p>
        </div>

        <div className="about-feature">
          <div className="feature-icon">🚚</div>
          <h3>GIAO HÀNG</h3>
          <p>Hỗ trợ giao hàng nhanh chóng trên toàn quốc.</p>
        </div>

        <div className="about-feature">
          <div className="feature-icon">💬</div>
          <h3>HỖ TRỢ</h3>
          <p>Tư vấn sản phẩm và hỗ trợ khách hàng tận tình.</p>
        </div>
      </div>
    </section>
  );
}

export default GioiThieu;

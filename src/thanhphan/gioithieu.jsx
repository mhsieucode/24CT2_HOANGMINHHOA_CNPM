function GioiThieu() {
  return (
    <section className="about" id="gioithieu">
      {/* TIÊU ĐỀ */}
      <div className="about-title">
        <span>🏍️</span>
        <h2>VỀ MOTO SHOP</h2>
        <span>🏍️</span>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="about-container">
        {/* ẢNH */}
        <div className="about-image">
          <img src="/image/BGR.jpg" alt="Moto Shop" />
        </div>

        {/* NỘI DUNG */}
        <div className="about-content">
          <h3>ĐAM MÊ TỐC ĐỘ - ĐỒNG HÀNH CÙNG BIKER</h3>

          <p>
            <strong>MOTO SHOP</strong> là cửa hàng chuyên cung cấp các sản phẩm
            và phụ kiện dành cho người yêu mô tô, xe máy và cộng đồng biker.
          </p>

          <p>
            Chúng tôi cung cấp đa dạng sản phẩm từ
            <strong>
              {" "}
              nón bảo hiểm, áo mô tô, giáp bảo hộ, găng tay, phụ kiện
            </strong>{" "}
            và nhiều sản phẩm dành cho người đi mô tô.
          </p>

          <p>
            MOTO SHOP luôn hướng đến chất lượng sản phẩm, giá cả hợp lý và mang
            đến trải nghiệm mua sắm tốt nhất cho khách hàng.
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

function DanhMuc() {
  return (
    <section className="category">
      <div className="category-header">
        <p>KHÁM PHÁ NGAY</p>
        <h2>Danh mục sản phẩm Moto 🏍️</h2>
      </div>

      <div className="category-list">
        <div className="category-item">
          <div className="category-circle">
            <img src="/image/mu1.jpg" alt="Nón bảo hiểm" />
          </div>
          <h3>Nón bảo hiểm</h3>
          <span>Xem sản phẩm →</span>
        </div>

        <div className="category-item">
          <div className="category-circle">
            <img src="/image/ao0.jpg" alt="Áo mô tô" />
          </div>
          <h3>Áo mô tô</h3>
          <span>Xem sản phẩm →</span>
        </div>

        <div className="category-item">
          <div className="category-circle">
            <img src="/image/chan4.jpg" alt="Giáp bảo hộ" />
          </div>
          <h3>Giáp bảo hộ</h3>
          <span>Xem sản phẩm →</span>
        </div>

        <div className="category-item">
          <div className="category-circle">
            <img src="/image/phukien2.jpg" alt="Phụ kiện" />
          </div>
          <h3>Phụ kiện</h3>
          <span>Xem sản phẩm →</span>
        </div>
      </div>
    </section>
  );
}

export default DanhMuc;

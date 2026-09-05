function DanhMuc() {
  return (
    <section className="category">
      <h2>
        Danh mục sản phẩm Moto<span>🏍️</span>
      </h2>

      <div className="category-list">
        {/* NÓN */}
        <div className="category-box">
          <div className="category-image">
            <img src="/image/mu1.jpg" alt="Nón bảo hiểm" />
          </div>

          <p>Nón bảo hiểm</p>
        </div>

        {/* ÁO */}
        <div className="category-box">
          <div className="category-image">
            <img src="/image/ao0.jpg" alt="Áo mô tô" />
          </div>
          <p>Áo mô tô</p>
        </div>

        {/* GIÁP */}
        <div className="category-box">
          <div className="category-image">
            <img src="/image/chan4.jpg" alt="Giáp bảo hộ" />
          </div>

          <p>Giáp bảo hộ</p>
        </div>

        {/* PHỤ KIỆN */}
        <div className="category-box">
          <div className="category-image">
            <img src="/image/phukien2.jpg" alt="Phụ kiện" />
          </div>

          <p>Phụ kiện</p>
        </div>
      </div>
    </section>
  );
}

export default DanhMuc;

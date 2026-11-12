function DanhMuc({ onChonDanhMuc }) {
  // ======================================
  // 4 DANH MỤC SẢN PHẨM
  // ======================================

  const danhSach = [
    {
      ten: "MŨ",
      danhMuc: "Mũ",
      anh: "/image/poster22.jpg",
    },
    {
      ten: "XE MOTO",
      danhMuc: "Xe Moto",
      anh: "/image/motoposter.jpg",
    },
    {
      ten: "BÁNH XE",
      danhMuc: "Bánh xe",
      anh: "/image/banhxe.jpg",
    },
    {
      ten: "PHỤ TÙNG XE",
      danhMuc: "Phụ tùng xe",
      anh: "/image/phukien2.jpg",
    },
  ];

  // ======================================
  // GIAO DIỆN DANH MỤC
  // ======================================

  return (
    <section className="category">
      {/* TIÊU ĐỀ DANH MỤC */}

      <div className="category-header">
        <p>⚡ SPEED • STYLE • PASSION ⚡</p>

        <h2>
          MH <span>MOTO</span>
        </h2>

        <div className="category-line"></div>

        <h3>KHÁM PHÁ THẾ GIỚI MOTO</h3>
      </div>

      {/* DANH SÁCH 4 DANH MỤC */}

      <div className="category-list">
        {danhSach.map((item) => (
          <div
            className="category-item"
            key={item.danhMuc}
            onClick={() => onChonDanhMuc?.(item.danhMuc)}
            style={{ cursor: "pointer" }}
          >
            {/* HÌNH ẢNH DANH MỤC */}

            <div className="category-circle">
              <img src={item.anh} alt={item.ten} />
            </div>

            {/* TÊN DANH MỤC */}

            <h3>{item.ten}</h3>

            <span></span>

            {/* MÔ TẢ */}

            <p>{item.moTa}</p>

            {/* NÚT XEM SẢN PHẨM */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChonDanhMuc?.(item.danhMuc);
              }}
            >
              XEM SẢN PHẨM
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DanhMuc;

import { useState } from "react";

function SanPham() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // =========================
  // MỞ CHI TIẾT SẢN PHẨM
  // =========================
  const openDetail = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  // =========================
  // ĐÓNG CHI TIẾT
  // =========================
  const closeDetail = () => {
    setSelectedProduct(null);
  };

  // =========================
  // TĂNG GIẢM SỐ LƯỢNG
  // =========================
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // =========================
  // HIỂN THỊ 1 SẢN PHẨM
  // =========================
  const ProductCard = ({
    image,
    name,
    price,
    category,
    number,
    hot = false,
  }) => {
    return (
      <div className="product-card">
        <div className="product-image">
          <img src={image} alt={name} />

          <span className="product-number">{number}</span>

          {hot && <span className="sale">HOT</span>}
        </div>

        <div className="product-info">
          <small>{category}</small>

          <h3>{name}</h3>

          <p>{price}</p>

          <button
            onClick={() =>
              openDetail({
                image,
                name,
                price,
                category,
              })
            }
          >
            CHI TIẾT →
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="products" id="sanpham">
        {/* ================================================= */}
        {/* SẢN PHẨM NỔI BẬT */}
        {/* ================================================= */}

        <div className="section-title">
          <span>SẢN PHẨM MOTO</span>
          <h2>Sản phẩm nổi bật 🔥</h2>
          <p>Những sản phẩm được yêu thích nhất dành cho Biker</p>
        </div>

        <div className="product-grid">
          <ProductCard
            image="/image/fullface1.jpg"
            name="FULLFACE 1"
            price="750.000đ"
            category="MŨ BẢO HIỂM"
            number="01"
            hot={true}
          />

          <ProductCard
            image="/image/chan3.jpg"
            name="GIÁP BẢO HỘ CHÂN"
            price="1.150.000đ"
            category="GIÁP BẢO HỘ"
            number="02"
          />

          <ProductCard
            image="/image/tay2.jpg"
            name="GĂNG TAY BẢO HỘ"
            price="1.000.000đ"
            category="PHỤ KIỆN MOTO"
            number="03"
          />

          <ProductCard
            image="/image/ao1.jpg"
            name="JACKET"
            price="1.500.000đ"
            category="ÁO MOTO"
            number="04"
          />
        </div>

        {/* ================================================= */}
        {/* NÓN BẢO HIỂM */}
        {/* ================================================= */}

        <div className="category-product">
          <div className="product-banner">
            <img src="/image/poster20.jpg" alt="Nón bảo hiểm" />

            <div className="banner-content">
              <span>COLLECTION 01</span>
              <h2>NÓN BẢO HIỂM</h2>
              <p>Bảo vệ an toàn - Phong cách mạnh mẽ</p>
            </div>
          </div>

          <div className="category-heading"></div>

          <div className="product-grid">
            <ProductCard
              image="/image/fullface1.jpg"
              name="FULLFACE 1"
              price="750.000đ"
              category="FULLFACE"
              number="01"
            />

            <ProductCard
              image="/image/fullface2.jpg"
              name="FULLFACE 2"
              price="850.000đ"
              category="FULLFACE"
              number="02"
            />

            <ProductCard
              image="/image/fullface3.jpg"
              name="FULLFACE 3"
              price="850.000đ"
              category="FULLFACE"
              number="03"
            />

            <ProductCard
              image="/image/fullface4.jpg"
              name="FULLFACE 4"
              price="850.000đ"
              category="FULLFACE"
              number="04"
            />
          </div>
        </div>

        {/* ================================================= */}
        {/* ÁO MÔ TÔ */}
        {/* ================================================= */}

        <div className="category-product">
          <div className="product-banner">
            <img src="/image/poster18.jpg" alt="Áo mô tô" />

            <div className="banner-content">
              <span>COLLECTION 02</span>
              <h2>ÁO MÔ TÔ</h2>
              <p>Phong cách mạnh mẽ cho mọi hành trình</p>
            </div>
          </div>

          <div className="category-heading"></div>

          <div className="product-grid">
            <ProductCard
              image="/image/ao4.jpg"
              name="JACKET 1"
              price="1.500.000đ"
              category="JACKET"
              number="01"
            />

            <ProductCard
              image="/image/ao6.jpg"
              name="JACKET 2"
              price="1.500.000đ"
              category="JACKET"
              number="02"
            />

            <ProductCard
              image="/image/ao7.jpg"
              name="JACKET 3"
              price="1.500.000đ"
              category="JACKET"
              number="03"
            />

            <ProductCard
              image="/image/ao5.jpg"
              name="JACKET 4"
              price="1.700.000đ"
              category="JACKET"
              number="04"
            />
          </div>
        </div>

        {/* ================================================= */}
        {/* GIÁP BẢO HỘ */}
        {/* ================================================= */}

        <div className="category-product">
          <div className="product-banner">
            <img src="/image/poster21.jpg" alt="Giáp bảo hộ" />

            <div className="banner-content">
              <span>COLLECTION 03</span>
              <h2>GIÁP BẢO HỘ</h2>
              <p>Bảo vệ tối đa cho những chuyến đi</p>
            </div>
          </div>

          <div className="category-heading"></div>

          <div className="product-grid">
            <ProductCard
              image="/image/chan3.jpg"
              name="GIÁP BẢO HỘ CHÂN 1"
              price="1.150.000đ"
              category="GIÁP BẢO HỘ"
              number="01"
            />

            <ProductCard
              image="/image/chan2.jpg"
              name="GIÁP BẢO HỘ CHÂN 2"
              price="1.150.000đ"
              category="GIÁP BẢO HỘ"
              number="02"
            />

            <ProductCard
              image="/image/chan7.jpg"
              name="GIÁP BẢO HỘ CHÂN 3"
              price="1.150.000đ"
              category="GIÁP BẢO HỘ"
              number="03"
            />

            <ProductCard
              image="/image/chan4.jpg"
              name="GIÁP BẢO HỘ CHÂN 4"
              price="1.300.000đ"
              category="GIÁP BẢO HỘ"
              number="04"
            />
          </div>
        </div>

        {/* ================================================= */}
        {/* PHỤ KIỆN */}
        {/* ================================================= */}

        <div className="category-product">
          <div className="product-banner">
            <img src="/image/poster21.png" alt="Phụ kiện Moto" />

            <div className="banner-content">
              <span>COLLECTION 04</span>
              <h2>PHỤ KIỆN MOTO</h2>
              <p>Hoàn thiện phong cách cho chiếc Moto của bạn</p>
            </div>
          </div>

          <div className="category-heading"></div>

          <div className="product-grid">
            <ProductCard
              image="/image/phukien3.jpg"
              name="BÁNH 1"
              price="1.500.000đ"
              category="PHỤ KIỆN"
              number="01"
            />

            <ProductCard
              image="/image/phukien4.jpg"
              name="BÁNH 2"
              price="1.500.000đ"
              category="PHỤ KIỆN"
              number="02"
            />

            <ProductCard
              image="/image/phukien5.jpg"
              name="BÁNH 3"
              price="1.500.000đ"
              category="PHỤ KIỆN"
              number="03"
            />

            <ProductCard
              image="/image/phukien6.jpg"
              name="BÁNH 4"
              price="1.700.000đ"
              category="PHỤ KIỆN"
              number="04"
            />
          </div>
        </div>
      </section>
      {/* ================================================= */}
      {/* POPUP CHI TIẾT SẢN PHẨM */}
      {/* ================================================= */}
      {selectedProduct && (
        <div className="product-detail-overlay" onClick={closeDetail}>
          <div
            className="product-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* NÚT ĐÓNG */}
            <button className="detail-close" onClick={closeDetail}>
              ×
            </button>

            {/* ========================= */}
            {/* BÊN TRÁI - HÌNH SẢN PHẨM */}
            {/* ========================= */}
            <div className="detail-product-left">
              <div className="detail-product-image">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>

              {/* CHẤM TRANG TRÍ */}
              <div className="detail-dots">
                <span className="active"></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            {/* ========================= */}
            {/* BÊN PHẢI - THÔNG TIN */}
            {/* ========================= */}
            <div className="detail-product-info">
              {/* TRẠNG THÁI */}
              <span className="detail-status">● CÒN HÀNG</span>

              {/* DANH MỤC */}
              <span className="detail-category">
                {selectedProduct.category}
              </span>

              {/* TÊN */}
              <h2>{selectedProduct.name}</h2>

              {/* MÔ TẢ */}
              <p className="detail-description">
                Sản phẩm chất lượng cao dành cho Biker, thiết kế mạnh mẽ, chắc
                chắn và phù hợp cho những chuyến đi đường dài.
              </p>

              {/* GIÁ */}
              <div className="detail-price">{selectedProduct.price}</div>

              {/* ĐƯỜNG KẺ */}
              <div className="detail-line"></div>

              {/* THÔNG SỐ */}
              <div className="detail-spec">
                <div>
                  <span>Hãng</span>
                  <strong>MOTO SHOP</strong>
                </div>

                <div>
                  <span>Dòng sản phẩm</span>
                  <strong>{selectedProduct.category}</strong>
                </div>

                <div>
                  <span>Chất liệu</span>
                  <strong>Cao cấp</strong>
                </div>

                <div>
                  <span>Tình trạng</span>
                  <strong>Còn hàng</strong>
                </div>
              </div>

              {/* ========================= */}
              {/* SỐ LƯỢNG */}
              {/* ========================= */}
              <div className="detail-quantity">
                <span>Số lượng</span>

                <div className="quantity-box">
                  <button onClick={decreaseQuantity}>−</button>

                  <span>{quantity}</span>

                  <button onClick={increaseQuantity}>+</button>
                </div>
              </div>

              {/* ========================= */}
              {/* BUTTON */}
              {/* ========================= */}
              <div className="detail-buttons">
                <button className="detail-cart-button">🛒 THÊM VÀO GIỎ</button>

                <button className="detail-buy-button">MUA NGAY</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SanPham;

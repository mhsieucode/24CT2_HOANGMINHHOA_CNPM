import ProductCard from "./ProductCard";

function ProductSection() {
  return (
    <section className="products" id="sanpham">
      <h2>Sản phẩm Moto</h2>

      <div className="product-grid">
        <ProductCard
          image="/image/fullface1.jpg"
          name="Nón Fullface"
          price="750.000đ"
        />

        <ProductCard
          image="/image/fullface2.jpg"
          name="Nón bảo hiểm Moto"
          price="850.000đ"
        />

        <ProductCard
          image="/image/fullface3.jpg"
          name="Nón bảo hiểm Moto"
          price="850.000đ"
        />
        <ProductCard
          image="/image/fullface4.jpg"
          name="Nón Fullface Racing"
          price="950.000đ"
        />

        <ProductCard
          image="/image/non2.jpg"
          name="Nón bảo hiểm Moto"
          price="850.000đ"
        />
        <ProductCard image="/image/ao1.jpg" name="Áo Moto" price="1.200.000đ" />

        <ProductCard
          image="/image/ao2.jpg"
          name="Áo Moto Racing"
          price="1.500.000đ"
        />

        <ProductCard
          image="/image/giap1.jpg"
          name="Giáp bảo hộ Moto"
          price="1.300.000đ"
        />

        <ProductCard
          image="/image/giap2.jpg"
          name="Giáp Moto Racing"
          price="1.600.000đ"
        />
      </div>
    </section>
  );
}

export default ProductSection;

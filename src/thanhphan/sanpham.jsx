import { useState, useEffect } from "react";

// ======================================
// 1. ĐỊA CHỈ API
// ======================================

const API = "http://localhost:5000/api/products";
const SERVER_URL = "http://localhost:5000";

// ======================================
// 2. DANH SÁCH 4 DANH MỤC SẢN PHẨM
// ======================================

const CAC_DANH_MUC = [
  {
    ten: "MŨ",
    giaTri: "Mũ",
    banner: "/image/poster20.jpg",
    collection: "COLLECTION 01",
  },
  {
    ten: "XE MOTO",
    giaTri: "Xe Moto",
    banner: "/image/posterxe.jpg",
    collection: "COLLECTION 02",
  },
  {
    ten: "BÁNH XE",
    giaTri: "Bánh xe",
    banner: "/image/posterbanh1.jpg",
    collection: "COLLECTION 03",
  },
  {
    ten: "PHỤ TÙNG XE",
    giaTri: "Phụ tùng xe",
    banner: "/image/poster21.jpg",
    collection: "COLLECTION 04",
  },
];

// ======================================
// 3. CHUẨN HÓA TÊN DANH MỤC
// ======================================

const chuanHoaDanhMuc = (ten) => {
  return String(ten || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

// ======================================
// 4. NHẬN DIỆN DANH MỤC CŨ VÀ MỚI
// ======================================

const layNhomDanhMuc = (ten) => {
  const danhMuc = chuanHoaDanhMuc(ten);

  // MŨ
  if (
    danhMuc === "mu" ||
    danhMuc === "non" ||
    danhMuc === "non bao hiem" ||
    danhMuc === "mu bao hiem"
  ) {
    return "Mũ";
  }

  // XE MOTO
  if (danhMuc === "moto" || danhMuc === "xe moto" || danhMuc === "xe mo to") {
    return "Xe Moto";
  }

  // BÁNH XE
  if (
    danhMuc === "banh xe" ||
    danhMuc === "phu kien moto" ||
    danhMuc === "phu kien" ||
    danhMuc === "banh"
  ) {
    return "Bánh xe";
  }

  // PHỤ TÙNG XE
  if (
    danhMuc === "phu tung xe" ||
    danhMuc === "phu tung moto" ||
    danhMuc === "phut moto" ||
    danhMuc === "phu tung" ||
    danhMuc === "ao giap"
  ) {
    return "Phụ tùng xe";
  }

  return "";
};

// ======================================
// 5. COMPONENT SẢN PHẨM
// ======================================

function SanPham({ danhMuc = "", boLocDanhMuc }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sanPhamMongo, setSanPhamMongo] = useState([]);

  // ======================================
  // 6. LẤY SẢN PHẨM TỪ MONGODB
  // ======================================

  const laySanPham = async () => {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Không thể lấy sản phẩm");
      }

      const data = await response.json();

      setSanPhamMongo(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // ======================================
  // 7. ĐƯỜNG DẪN HÌNH ẢNH SẢN PHẨM
  // ======================================

  const layDuongDanAnh = (url) => {
    if (!url) return "/image/fullface1.jpg";

    const duongDan = String(url).trim();

    if (duongDan.startsWith("http://") || duongDan.startsWith("https://")) {
      return duongDan;
    }

    if (duongDan.startsWith("/")) {
      return `${SERVER_URL}${duongDan}`;
    }

    return `${SERVER_URL}/${duongDan}`;
  };

  // ======================================
  // 8. ĐỊNH DẠNG GIÁ
  // ======================================

  const dinhDangGia = (gia) => {
    return Number(gia).toLocaleString("vi-VN") + "đ";
  };

  // ======================================
  // 9. MỞ CHI TIẾT SẢN PHẨM
  // ======================================

  const openDetail = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  // ======================================
  // 10. ĐÓNG CHI TIẾT SẢN PHẨM
  // ======================================

  const closeDetail = () => {
    setSelectedProduct(null);
  };

  // ======================================
  // 11. THÊM SẢN PHẨM VÀO GIỎ HÀNG
  // ======================================

  const themVaoGioHang = () => {
    if (!selectedProduct) return;

    const gioHang = JSON.parse(localStorage.getItem("gioHang") || "[]");

    const id = selectedProduct._id;
    const gia = Number(selectedProduct.gia);
    const soLuongKho = Number(selectedProduct.soLuong || 0);

    if (!id) {
      alert("Không xác định được sản phẩm!");
      return;
    }

    if (quantity > soLuongKho) {
      alert("Số lượng sản phẩm trong kho không đủ!");
      return;
    }

    const sanPhamCu = gioHang.find((item) => String(item.id) === String(id));

    if (sanPhamCu) {
      if (sanPhamCu.soLuong + quantity > soLuongKho) {
        alert("Số lượng sản phẩm trong kho không đủ!");
        return;
      }

      sanPhamCu.soLuong += quantity;
    } else {
      gioHang.push({
        id: id,
        tenSanPham: selectedProduct.tenSanPham,
        hinhAnh: selectedProduct.hinhAnh,
        gia: gia,
        soLuong: quantity,
        danhMuc: layNhomDanhMuc(selectedProduct.danhMuc),
      });
    }

    localStorage.setItem("gioHang", JSON.stringify(gioHang));

    alert("Đã thêm sản phẩm vào giỏ hàng!");

    closeDetail();
  };

  // ======================================
  // 12. TĂNG GIẢM SỐ LƯỢNG
  // ======================================

  const increaseQuantity = () => {
    if (quantity < Number(selectedProduct?.soLuong || 0)) {
      setQuantity((prev) => prev + 1);
    } else {
      alert("Số lượng trong kho không đủ!");
    }
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // ======================================
  // 13. HIỂN THỊ MỘT SẢN PHẨM
  // ======================================

  const ProductCard = ({ product, index }) => {
    return (
      <div className="product-card">
        {/* HÌNH ẢNH SẢN PHẨM */}
        <div className="product-image">
          <img src={layDuongDanAnh(product.hinhAnh)} alt={product.tenSanPham} />

          <span className="product-number">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* THÔNG TIN SẢN PHẨM */}
        <div className="product-info">
          <small>{layNhomDanhMuc(product.danhMuc) || product.danhMuc}</small>

          <h3>{product.tenSanPham}</h3>

          <p>{dinhDangGia(product.gia)}</p>

          <button type="button" onClick={() => openDetail(product)}>
            CHI TIẾT →
          </button>
        </div>
      </div>
    );
  };

  // ======================================
  // 14. LỌC SẢN PHẨM THEO DANH MỤC
  // ======================================

  const nhomDangChon = layNhomDanhMuc(danhMuc);

  // LẤY POSTER CỦA DANH MỤC ĐANG CHỌN
  const nhomDuocChon = CAC_DANH_MUC.find(
    (nhom) => nhom.giaTri === nhomDangChon
  );

  // LỌC SẢN PHẨM
  const sanPhamDuocChon = nhomDangChon
    ? sanPhamMongo.filter(
        (product) => layNhomDanhMuc(product.danhMuc) === nhomDangChon
      )
    : sanPhamMongo;

  // ======================================
  // 15. GIAO DIỆN SẢN PHẨM
  // ======================================

  return (
    <>
      <section className="products" id="sanpham">
        {/* TIÊU ĐỀ DANH MỤC */}
        <div className="section-title">
          <span>MH MOTO SHOP</span>

          <h2>
            {nhomDangChon ? nhomDangChon.toUpperCase() : "TẤT CẢ SẢN PHẨM"}
          </h2>

          <p>
            {nhomDangChon
              ? `Khám phá các sản phẩm thuộc ${nhomDangChon}`
              : "Những sản phẩm dành cho người đam mê Moto"}
          </p>

          {nhomDangChon && (
            <button type="button" onClick={boLocDanhMuc}>
              ← XEM TẤT CẢ SẢN PHẨM
            </button>
          )}
        </div>

        {/* ==================================
            KHI NGƯỜI DÙNG CHỌN DANH MỤC
        ================================== */}

        {nhomDangChon ? (
          <div className="category-product">
            {/* POSTER BÊN TRÁI */}
            <div className="product-banner">
              <img src={nhomDuocChon?.banner} alt={nhomDuocChon?.ten} />

              <div className="banner-content">
                <span>{nhomDuocChon?.collection}</span>
                <h2>{nhomDuocChon?.ten}</h2>
              </div>
            </div>

            {/* SẢN PHẨM BÊN PHẢI */}
            <div className="product-grid">
              {sanPhamDuocChon.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

            {/* KHÔNG CÓ SẢN PHẨM */}
            {sanPhamDuocChon.length === 0 && <p className="empty-product"></p>}
          </div>
        ) : (
          /* ==================================
             KHI HIỂN THỊ TẤT CẢ DANH MỤC
          ================================== */

          CAC_DANH_MUC.map((nhom) => {
            const danhSach = sanPhamMongo.filter(
              (product) => layNhomDanhMuc(product.danhMuc) === nhom.giaTri
            );

            return (
              <div className="category-product" key={nhom.giaTri}>
                {/* POSTER DANH MỤC BÊN TRÁI */}
                <div className="product-banner">
                  <img src={nhom.banner} alt={nhom.ten} />

                  <div className="banner-content">
                    <span>{nhom.collection}</span>
                    <h2>{nhom.ten}</h2>
                  </div>
                </div>

                {/* SẢN PHẨM BÊN PHẢI */}
                <div className="product-grid">
                  {danhSach.map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>

                {/* THÔNG BÁO KHI DANH MỤC TRỐNG */}
                {danhSach.length === 0 && <p className="empty-product"></p>}
              </div>
            );
          })
        )}
      </section>

      {/* ======================================
          16. POPUP CHI TIẾT SẢN PHẨM
      ====================================== */}

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

            {/* HÌNH ẢNH SẢN PHẨM */}
            <div className="detail-product-left">
              <div className="detail-product-image">
                <img
                  src={layDuongDanAnh(selectedProduct.hinhAnh)}
                  alt={selectedProduct.tenSanPham}
                />
              </div>

              <div className="detail-dots">
                <span className="active"></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            {/* THÔNG TIN SẢN PHẨM */}
            <div className="detail-product-info">
              <span className="detail-status">
                ● {selectedProduct.soLuong > 0 ? "CÒN HÀNG" : "HẾT HÀNG"}
              </span>

              <span className="detail-category">
                {layNhomDanhMuc(selectedProduct.danhMuc) ||
                  selectedProduct.danhMuc}
              </span>

              <h2>{selectedProduct.tenSanPham}</h2>

              <p className="detail-description">
                {selectedProduct.moTa ||
                  "Sản phẩm chất lượng cao dành cho Biker, thiết kế mạnh mẽ và chắc chắn."}
              </p>

              <div className="detail-price">
                {dinhDangGia(selectedProduct.gia)}
              </div>

              <div className="detail-line"></div>

              {/* THÔNG SỐ SẢN PHẨM */}
              <div className="detail-spec">
                <div>
                  <span>Hãng</span>
                  <strong>MH MOTO</strong>
                </div>

                <div>
                  <span>Danh mục</span>
                  <strong>
                    {layNhomDanhMuc(selectedProduct.danhMuc) ||
                      selectedProduct.danhMuc}
                  </strong>
                </div>

                <div>
                  <span>Số lượng còn</span>
                  <strong>{selectedProduct.soLuong}</strong>
                </div>

                <div>
                  <span>Tình trạng</span>
                  <strong>
                    {selectedProduct.soLuong > 0 ? "Còn hàng" : "Hết hàng"}
                  </strong>
                </div>
              </div>

              {/* CHỌN SỐ LƯỢNG */}
              <div className="detail-quantity">
                <span>Số lượng</span>

                <div className="quantity-box">
                  <button type="button" onClick={decreaseQuantity}>
                    −
                  </button>

                  <span>{quantity}</span>

                  <button type="button" onClick={increaseQuantity}>
                    +
                  </button>
                </div>
              </div>

              {/* NÚT MUA HÀNG */}
              <div className="detail-buttons">
                <button
                  className="detail-cart-button"
                  onClick={themVaoGioHang}
                  disabled={Number(selectedProduct.soLuong) <= 0}
                >
                  🛒 THÊM VÀO GIỎ
                </button>

                <button
                  className="detail-buy-button"
                  onClick={() =>
                    alert(
                      "Bạn có thể thêm sản phẩm vào giỏ hàng để tiếp tục mua!"
                    )
                  }
                >
                  MUA NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SanPham;

import { useState, useEffect } from "react";

// ======================================
// 1. ĐỊA CHỈ API
// ======================================

const API = "http://localhost:5000/api/products";
const SERVER_URL = "http://localhost:5000";

// ======================================
// 2. DANH MỤC SẢN PHẨM
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
// 3. THÔNG SỐ THEO DANH MỤC
// PHẢI KHỚP VỚI ADMIN VÀ BACKEND
// ======================================

const THONG_SO_THEO_DANH_MUC = {
  Mũ: ["Thương hiệu", "Loại mũ", "Chất liệu", "Kích thước"],

  "Xe Moto": [
    "Dung tích xi-lanh",
    "Công suất",
    "Loại động cơ",
    "Hộp số",
    "Màu sắc",
  ],

  "Bánh xe": ["Thương hiệu", "Kích thước", "Chất liệu", "Loại lốp"],

  "Phụ tùng xe": [
    "Thương hiệu",
    "Mã sản phẩm",
    "Chất liệu",
    "Dòng xe tương thích",
  ],
};

// ======================================
// 4. CHUẨN HÓA CHỮ
// ======================================

const chuanHoaChu = (chuoi) => {
  return String(chuoi || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

const chuanHoaKhoa = (chuoi) => {
  return chuanHoaChu(chuoi).replace(/[^a-z0-9]/g, "");
};

// ======================================
// 5. NHẬN DIỆN DANH MỤC
// ======================================

const layNhomDanhMuc = (ten) => {
  const danhMuc = chuanHoaChu(ten);

  if (["mu", "non", "non bao hiem", "mu bao hiem"].includes(danhMuc)) {
    return "Mũ";
  }

  if (["moto", "xe moto", "xe mo to"].includes(danhMuc)) {
    return "Xe Moto";
  }

  if (["banh xe", "banh"].includes(danhMuc)) {
    return "Bánh xe";
  }

  if (
    [
      "phu tung xe",
      "phu tung moto",
      "phu tung",
      "ao giap",
      "phu kien",
      "phu kien moto",
    ].includes(danhMuc)
  ) {
    return "Phụ tùng xe";
  }

  return "";
};

// ======================================
// 6. CHUYỂN THÔNG SỐ VỀ OBJECT
// ======================================

const chuyenThongSoThanhObject = (thongSo) => {
  if (!thongSo) return {};

  if (typeof thongSo === "string") {
    try {
      thongSo = JSON.parse(thongSo);
    } catch (error) {
      console.error("Không đọc được JSON thông số:", error);
      return {};
    }
  }

  if (thongSo instanceof Map) {
    return Object.fromEntries(thongSo);
  }

  if (Array.isArray(thongSo)) {
    const ketQua = {};

    thongSo.forEach((item) => {
      if (Array.isArray(item) && item.length >= 2) {
        ketQua[String(item[0])] = item[1];
      } else if (item && typeof item === "object") {
        const ten = item.ten || item.name || item.key;
        const giaTri = item.giaTri ?? item.value ?? item.val;

        if (ten) {
          ketQua[String(ten)] = giaTri;
        }
      }
    });

    return ketQua;
  }

  if (typeof thongSo === "object") {
    return { ...thongSo };
  }

  return {};
};

// ======================================
// 7. LẤY THÔNG SỐ CỦA SẢN PHẨM
// ƯU TIÊN thongSoKyThuat
// NẾU KHÔNG CÓ THÌ ĐỌC thongSo
// ======================================

const layThongSoGoc = (product) => {
  if (!product) return {};

  const thongSoMoi = chuyenThongSoThanhObject(product.thongSoKyThuat);

  const thongSoCu = chuyenThongSoThanhObject(product.thongSo);

  if (Object.keys(thongSoMoi).length > 0) {
    return thongSoMoi;
  }

  return thongSoCu;
};

// ======================================
// 8. LẤY DANH SÁCH THÔNG SỐ KỸ THUẬT
// ======================================

const layDanhSachThongSo = (product) => {
  if (!product) return [];

  const thongSoObject = layThongSoGoc(product);
  const danhMuc = layNhomDanhMuc(product.danhMuc);

  const danhSachTen = THONG_SO_THEO_DANH_MUC[danhMuc] || [];

  const cacKhoa = Object.keys(thongSoObject);
  const ketQua = [];
  const daHienThi = new Set();

  // Hiển thị theo thứ tự thông số của danh mục
  danhSachTen.forEach((ten) => {
    const khoa = cacKhoa.find(
      (item) => chuanHoaKhoa(item) === chuanHoaKhoa(ten)
    );

    if (!khoa) return;

    const giaTri = thongSoObject[khoa];

    if (
      giaTri === undefined ||
      giaTri === null ||
      String(giaTri).trim() === ""
    ) {
      return;
    }

    ketQua.push({
      ten,
      giaTri: String(giaTri).trim(),
    });

    daHienThi.add(khoa);
  });

  // Hiển thị thêm thông số khác nếu có
  Object.entries(thongSoObject).forEach(([ten, giaTri]) => {
    if (daHienThi.has(ten)) return;

    if (
      giaTri === undefined ||
      giaTri === null ||
      String(giaTri).trim() === ""
    ) {
      return;
    }

    ketQua.push({
      ten,
      giaTri: String(giaTri).trim(),
    });
  });

  return ketQua;
};

// ======================================
// 9. COMPONENT SẢN PHẨM
// ======================================

function SanPham({ danhMuc = "", boLocDanhMuc }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sanPhamMongo, setSanPhamMongo] = useState([]);
  const [tuKhoa, setTuKhoa] = useState("");
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);

  // ======================================
  // 10. ĐƯỜNG DẪN ẢNH
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
  // 11. ĐỊNH DẠNG GIÁ
  // ======================================

  const dinhDangGia = (gia) => {
    return Number(gia || 0).toLocaleString("vi-VN") + "đ";
  };

  // ======================================
  // 12. LẤY SẢN PHẨM TỪ MONGODB
  // ======================================

  const laySanPham = async () => {
    try {
      const response = await fetch(API, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể lấy sản phẩm!");
      }

      const danhSach = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      console.log("DANH SÁCH SẢN PHẨM:", danhSach);

      console.table(
        danhSach.map((item) => ({
          ten: item.tenSanPham,
          danhMuc: item.danhMuc,
          thongSo: JSON.stringify(layThongSoGoc(item)),
        }))
      );

      setSanPhamMongo(danhSach);

      setSelectedProduct((prev) => {
        if (!prev) return null;

        const sanPhamMoi = danhSach.find(
          (item) => String(item._id) === String(prev._id)
        );

        return sanPhamMoi || prev;
      });

      return danhSach;
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      return [];
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // ======================================
  // 13. TÌM KIẾM SẢN PHẨM
  // ======================================

  const sanPhamTimKiem = (product) => {
    const tuKhoaChuan = chuanHoaChu(tuKhoa);

    if (!tuKhoaChuan) return true;

    const thongSo = layDanhSachThongSo(product);

    const thongTin = [
      product.tenSanPham,
      product.danhMuc,
      product.moTa,
      ...thongSo.map((item) => item.ten),
      ...thongSo.map((item) => item.giaTri),
    ];

    return thongTin.some((item) => chuanHoaChu(item).includes(tuKhoaChuan));
  };

  // ======================================
  // 14. MỞ CHI TIẾT SẢN PHẨM
  // ======================================

  const openDetail = async (product) => {
    setQuantity(1);
    setSelectedProduct(product);
    setDangTaiChiTiet(true);

    try {
      const response = await fetch(`${API}/${product._id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Không lấy được chi tiết sản phẩm!");
      }

      const data = await response.json();
      const sanPhamMoi = data.product || data;

      if (sanPhamMoi && sanPhamMoi._id) {
        const thongSoChiTiet =
          sanPhamMoi.thongSoKyThuat ??
          sanPhamMoi.thongSo ??
          product.thongSoKyThuat ??
          product.thongSo ??
          {};

        const sanPhamDayDu = {
          ...product,
          ...sanPhamMoi,

          thongSoKyThuat:
            sanPhamMoi.thongSoKyThuat !== undefined
              ? sanPhamMoi.thongSoKyThuat
              : product.thongSoKyThuat,

          thongSo:
            sanPhamMoi.thongSo !== undefined
              ? sanPhamMoi.thongSo
              : product.thongSo,
        };

        // Nếu chỉ có dữ liệu ở một trường thì vẫn đọc được
        if (Object.keys(chuyenThongSoThanhObject(thongSoChiTiet)).length > 0) {
          sanPhamDayDu.thongSoKyThuat = thongSoChiTiet;
        }

        setSelectedProduct(sanPhamDayDu);

        setSanPhamMongo((prev) =>
          prev.map((item) =>
            String(item._id) === String(sanPhamDayDu._id) ? sanPhamDayDu : item
          )
        );

        console.log("CHI TIẾT SẢN PHẨM:", sanPhamDayDu);
        console.log("THÔNG SỐ KỸ THUẬT:", layThongSoGoc(sanPhamDayDu));

        console.table(layDanhSachThongSo(sanPhamDayDu));
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết sản phẩm:", error);
      setSelectedProduct(product);
    } finally {
      setDangTaiChiTiet(false);
    }
  };

  // ======================================
  // 15. ĐÓNG CHI TIẾT
  // ======================================

  const closeDetail = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  // ======================================
  // 16. THÊM VÀO GIỎ HÀNG
  // ======================================

  const themVaoGioHang = () => {
    if (!selectedProduct) return;

    let gioHang = [];

    try {
      gioHang = JSON.parse(localStorage.getItem("gioHang") || "[]");

      if (!Array.isArray(gioHang)) {
        gioHang = [];
      }
    } catch {
      gioHang = [];
    }

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
      const soLuongHienTai = Number(sanPhamCu.soLuong || 0);

      if (soLuongHienTai + quantity > soLuongKho) {
        alert("Số lượng sản phẩm trong kho không đủ!");
        return;
      }

      sanPhamCu.soLuong = soLuongHienTai + quantity;
    } else {
      gioHang.push({
        id,
        tenSanPham: selectedProduct.tenSanPham,
        hinhAnh: selectedProduct.hinhAnh,
        gia,
        soLuong: quantity,
        danhMuc: layNhomDanhMuc(selectedProduct.danhMuc),
      });
    }

    localStorage.setItem("gioHang", JSON.stringify(gioHang));

    alert("Đã thêm sản phẩm vào giỏ hàng!");

    closeDetail();
  };

  // ======================================
  // 17. TĂNG GIẢM SỐ LƯỢNG
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
  // 18. THẺ SẢN PHẨM
  // ======================================

  const ProductCard = ({ product, index }) => (
    <div className="product-card">
      <div className="product-image">
        <img src={layDuongDanAnh(product.hinhAnh)} alt={product.tenSanPham} />

        <span className="product-number">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

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

  // ======================================
  // 19. LỌC DANH MỤC
  // ======================================

  const nhomDangChon = layNhomDanhMuc(danhMuc);

  const nhomDuocChon = CAC_DANH_MUC.find(
    (nhom) => nhom.giaTri === nhomDangChon
  );

  const sanPhamDuocChon = sanPhamMongo.filter((product) => {
    const dungDanhMuc = nhomDangChon
      ? layNhomDanhMuc(product.danhMuc) === nhomDangChon
      : true;

    return dungDanhMuc && sanPhamTimKiem(product);
  });

  const dangTimKiem = tuKhoa.trim().length > 0;

  // ======================================
  // 20. GIAO DIỆN DANH SÁCH SẢN PHẨM
  // ======================================

  return (
    <>
      <section className="products" id="sanpham">
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

        <div className="sanpham-search">
          <span className="sanpham-search-icon">⌕</span>

          <input
            type="text"
            placeholder="Tìm kiếm xe moto, mũ bảo hiểm, phụ kiện..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
          />

          {tuKhoa && (
            <button
              type="button"
              className="sanpham-search-clear"
              onClick={() => setTuKhoa("")}
              title="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>

        {dangTimKiem && (
          <p className="search-result-count">
            Tìm thấy <strong>{sanPhamDuocChon.length}</strong> sản phẩm phù hợp
            với "{tuKhoa}"
          </p>
        )}

        {nhomDangChon ? (
          <div className="category-product">
            <div className="product-banner">
              <img src={nhomDuocChon?.banner} alt={nhomDuocChon?.ten} />

              <div className="banner-content">
                <span>{nhomDuocChon?.collection}</span>
                <h2>{nhomDuocChon?.ten}</h2>
              </div>
            </div>

            <div className="product-grid">
              {sanPhamDuocChon.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

            {sanPhamDuocChon.length === 0 && (
              <p className="empty-product">
                {dangTimKiem
                  ? "Không tìm thấy sản phẩm phù hợp!"
                  : "Danh mục hiện chưa có sản phẩm."}
              </p>
            )}
          </div>
        ) : (
          CAC_DANH_MUC.map((nhom) => {
            const danhSach = sanPhamDuocChon.filter(
              (product) => layNhomDanhMuc(product.danhMuc) === nhom.giaTri
            );

            if (dangTimKiem && danhSach.length === 0) {
              return null;
            }

            return (
              <div className="category-product" key={nhom.giaTri}>
                <div className="product-banner">
                  <img src={nhom.banner} alt={nhom.ten} />

                  <div className="banner-content">
                    <span>{nhom.collection}</span>
                    <h2>{nhom.ten}</h2>
                  </div>
                </div>

                <div className="product-grid">
                  {danhSach.map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>

                {!dangTimKiem && danhSach.length === 0 && (
                  <p className="empty-product">
                    Danh mục hiện chưa có sản phẩm.
                  </p>
                )}
              </div>
            );
          })
        )}

        {!nhomDangChon && dangTimKiem && sanPhamDuocChon.length === 0 && (
          <div className="search-no-result">
            <span>⌕</span>

            <h3>KHÔNG TÌM THẤY SẢN PHẨM</h3>

            <p>Không có sản phẩm phù hợp với từ khóa "{tuKhoa}".</p>

            <button type="button" onClick={() => setTuKhoa("")}>
              XÓA TÌM KIẾM
            </button>
          </div>
        )}
      </section>

      {/* ======================================
          21. POPUP CHI TIẾT SẢN PHẨM
      ====================================== */}

      {selectedProduct && (
        <div className="product-detail-overlay" onClick={closeDetail}>
          <div
            className="product-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="detail-close"
              type="button"
              onClick={closeDetail}
            >
              ×
            </button>

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

            <div className="detail-product-info">
              <span className="detail-status">
                ●{" "}
                {Number(selectedProduct.soLuong) > 0 ? "CÒN HÀNG" : "HẾT HÀNG"}
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

              {/* THÔNG SỐ KỸ THUẬT */}
              <div className="detail-spec">
                <h3>THÔNG SỐ KỸ THUẬT</h3>

                {dangTaiChiTiet ? (
                  <p>Đang tải thông tin sản phẩm...</p>
                ) : (
                  <>
                    {layDanhSachThongSo(selectedProduct).length > 0 ? (
                      layDanhSachThongSo(selectedProduct).map(
                        ({ ten, giaTri }) => (
                          <div className="detail-spec-row" key={ten}>
                            <span>{ten}</span>
                            <strong>{giaTri}</strong>
                          </div>
                        )
                      )
                    ) : (
                      <p className="detail-no-spec">
                        Sản phẩm chưa có thông số kỹ thuật.
                      </p>
                    )}
                  </>
                )}

                <div className="detail-spec-row">
                  <span>Danh mục</span>
                  <strong>
                    {layNhomDanhMuc(selectedProduct.danhMuc) ||
                      selectedProduct.danhMuc}
                  </strong>
                </div>

                <div className="detail-spec-row">
                  <span>Số lượng còn</span>
                  <strong>{selectedProduct.soLuong || 0}</strong>
                </div>

                <div className="detail-spec-row">
                  <span>Tình trạng</span>
                  <strong>
                    {Number(selectedProduct.soLuong) > 0
                      ? "Còn hàng"
                      : "Hết hàng"}
                  </strong>
                </div>
              </div>

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

              <div className="detail-buttons">
                <button
                  className="detail-cart-button"
                  type="button"
                  onClick={themVaoGioHang}
                  disabled={
                    Number(selectedProduct.soLuong) <= 0 || dangTaiChiTiet
                  }
                >
                  🛒 THÊM VÀO GIỎ
                </button>

                <button
                  className="detail-buy-button"
                  type="button"
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

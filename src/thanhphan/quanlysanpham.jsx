import { useEffect, useState } from "react";
import "../App.css";

// ======================================
// 1. ĐỊA CHỈ API
// ======================================

const SERVER_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API = `${SERVER_URL}/api/products`;

// ======================================
// 2. DANH SÁCH DANH MỤC
// ======================================

const DANH_MUC = ["Mũ", "Xe Moto", "Bánh xe", "Phụ tùng xe"];

// ======================================
// 3. LẤY THÔNG TIN TÀI KHOẢN
// ======================================

const layTaiKhoan = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Lỗi đọc tài khoản:", error);
    return null;
  }
};

// ======================================
// 4. KIỂM TRA QUYỀN QUẢN LÝ
// ADMIN VÀ STAFF ĐƯỢC PHÉP
// ======================================

const kiemTraQuyenQuanLy = () => {
  const user = layTaiKhoan();

  if (!user || !(user._id || user.id)) {
    alert("Bạn cần đăng nhập để sử dụng chức năng này!");
    return false;
  }

  if (!["admin", "staff"].includes(user.role)) {
    alert("Bạn không có quyền quản lý sản phẩm!");
    return false;
  }

  return true;
};

// ======================================
// 5. COMPONENT QUẢN LÝ SẢN PHẨM
// ======================================

function QuanLySanPham({ dong }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [hinhAnh, setHinhAnh] = useState(null);
  const [anhCu, setAnhCu] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [dangTai, setDangTai] = useState(false);

  const [form, setForm] = useState({
    tenSanPham: "",
    gia: "",
    moTa: "",
    soLuong: 0,
    danhMuc: "Xe Moto",
  });

  // ======================================
  // 6. LẤY ĐƯỜNG DẪN ẢNH
  // ======================================

  const layDuongDanAnh = (url) => {
    if (!url) return "";

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
  // 7. LẤY DANH SÁCH SẢN PHẨM
  // ======================================

  const laySanPham = async () => {
    try {
      setDangTai(true);

      const response = await fetch(API, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải sản phẩm!");
      }

      const danhSach = Array.isArray(data) ? data : data.products || [];

      setProducts(danhSach);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      alert(error.message || "Không thể tải sản phẩm!");
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // ======================================
  // 8. NHẬP DỮ LIỆU
  // ======================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================
  // 9. CHỌN ẢNH SẢN PHẨM
  // ======================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ!");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 5MB!");
      e.target.value = "";
      return;
    }

    setHinhAnh(file);
  };

  // ======================================
  // 10. THÊM HOẶC CẬP NHẬT SẢN PHẨM
  // ======================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dangLuu) return;

    if (!kiemTraQuyenQuanLy()) return;

    const tenSanPham = form.tenSanPham.trim();
    const gia = Number(form.gia);
    const soLuong = Number(form.soLuong);

    if (!tenSanPham) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (!Number.isFinite(gia) || gia < 0) {
      alert("Giá sản phẩm không hợp lệ!");
      return;
    }

    if (!Number.isInteger(soLuong) || soLuong < 0) {
      alert("Số lượng sản phẩm phải là số nguyên không âm!");
      return;
    }

    if (!DANH_MUC.includes(form.danhMuc)) {
      alert("Vui lòng chọn danh mục hợp lệ!");
      return;
    }

    try {
      setDangLuu(true);

      const formData = new FormData();

      formData.append("tenSanPham", tenSanPham);
      formData.append("gia", String(gia));
      formData.append("moTa", form.moTa);
      formData.append("soLuong", String(soLuong));
      formData.append("danhMuc", form.danhMuc);

      if (hinhAnh) {
        formData.append("hinhAnh", hinhAnh);
      }

      const url = editingId ? `${API}/${editingId}` : API;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi lưu sản phẩm!");
      }

      alert(
        editingId
          ? "Cập nhật sản phẩm thành công!"
          : "Thêm sản phẩm thành công!"
      );

      handleCancel();
      await laySanPham();
    } catch (error) {
      console.error("Lỗi lưu sản phẩm:", error);
      alert(error.message || "Không thể kết nối server!");
    } finally {
      setDangLuu(false);
    }
  };

  // ======================================
  // 11. CHỌN SẢN PHẨM ĐỂ SỬA
  // ======================================

  const handleEdit = (product) => {
    if (!kiemTraQuyenQuanLy()) return;

    setEditingId(product._id);

    setForm({
      tenSanPham: product.tenSanPham || "",
      gia: product.gia ?? "",
      moTa: product.moTa || "",
      soLuong: product.soLuong ?? 0,
      danhMuc: DANH_MUC.includes(product.danhMuc) ? product.danhMuc : "Xe Moto",
    });

    setAnhCu(product.hinhAnh || "");
    setHinhAnh(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ======================================
  // 12. XÓA SẢN PHẨM
  // ======================================

  const handleDelete = async (id) => {
    if (!kiemTraQuyenQuanLy()) return;

    const xacNhan = window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?");

    if (!xacNhan) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Xóa sản phẩm thất bại!");
      }

      alert("Xóa sản phẩm thành công!");

      await laySanPham();
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      alert(error.message || "Không thể kết nối server!");
    }
  };

  // ======================================
  // 13. HỦY CHỈNH SỬA
  // ======================================

  const handleCancel = () => {
    setEditingId(null);
    setHinhAnh(null);
    setAnhCu("");

    setForm({
      tenSanPham: "",
      gia: "",
      moTa: "",
      soLuong: 0,
      danhMuc: "Xe Moto",
    });
  };

  // ======================================
  // 14. ẢNH XEM TRƯỚC
  // ======================================

  const [anhXemTruoc, setAnhXemTruoc] = useState("");

  useEffect(() => {
    if (!hinhAnh) {
      setAnhXemTruoc("");
      return;
    }

    const url = URL.createObjectURL(hinhAnh);
    setAnhXemTruoc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [hinhAnh]);

  // ======================================
  // 15. KIỂM TRA QUYỀN HIỂN THỊ
  // ======================================

  const user = layTaiKhoan();

  const coQuyenQuanLy =
    Boolean(user && (user._id || user.id)) &&
    ["admin", "staff"].includes(user.role);

  // ======================================
  // 16. GIAO DIỆN
  // ======================================

  return (
    <div className="quan-ly-san-pham">
      <h1>QUẢN LÝ SẢN PHẨM</h1>

      <button type="button" onClick={dong}>
        QUAY LẠI DASHBOARD
      </button>

      {!coQuyenQuanLy && (
        <div className="thong-bao-quyen">
          <h3>Bạn không có quyền quản lý sản phẩm!</h3>
          <p>Vui lòng đăng nhập bằng tài khoản Admin hoặc Nhân viên.</p>
        </div>
      )}

      {/* FORM THÊM VÀ CẬP NHẬT */}

      {coQuyenQuanLy && (
        <form onSubmit={handleSubmit} className="product-form">
          <h2>{editingId ? "CẬP NHẬT SẢN PHẨM" : "THÊM SẢN PHẨM MỚI"}</h2>

          {/* TÊN SẢN PHẨM */}

          <label htmlFor="tenSanPham">Tên sản phẩm:</label>

          <input
            id="tenSanPham"
            name="tenSanPham"
            type="text"
            placeholder="Nhập tên sản phẩm"
            value={form.tenSanPham}
            onChange={handleChange}
            required
          />

          {/* GIÁ */}

          <label htmlFor="gia">Giá sản phẩm:</label>

          <input
            id="gia"
            name="gia"
            type="number"
            placeholder="Nhập giá sản phẩm"
            value={form.gia}
            onChange={handleChange}
            min="0"
            required
          />

          {/* SỐ LƯỢNG */}

          <label htmlFor="soLuong">Số lượng trong kho:</label>

          <input
            id="soLuong"
            name="soLuong"
            type="number"
            placeholder="Nhập số lượng"
            value={form.soLuong}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />

          {/* DANH MỤC */}

          <label htmlFor="danhMuc">Danh mục sản phẩm:</label>

          <select
            id="danhMuc"
            name="danhMuc"
            value={form.danhMuc}
            onChange={handleChange}
            required
          >
            {DANH_MUC.map((danhMuc) => (
              <option key={danhMuc} value={danhMuc}>
                {danhMuc}
              </option>
            ))}
          </select>

          {/* ẢNH SẢN PHẨM */}

          <label htmlFor="hinhAnh">Chọn ảnh sản phẩm:</label>

          <input
            id="hinhAnh"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          {/* ẢNH XEM TRƯỚC */}

          {hinhAnh && anhXemTruoc && (
            <div className="product-image-preview">
              <p>Ảnh vừa chọn:</p>

              <img
                src={anhXemTruoc}
                alt="Ảnh xem trước"
                style={{
                  width: "180px",
                  height: "140px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}

          {/* ẢNH CŨ */}

          {!hinhAnh && anhCu && (
            <div className="product-image-preview">
              <p>Ảnh sản phẩm hiện tại:</p>

              <img
                src={layDuongDanAnh(anhCu)}
                alt="Ảnh sản phẩm hiện tại"
                style={{
                  width: "180px",
                  height: "140px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.alt = "Không tải được ảnh";
                }}
              />
            </div>
          )}

          {/* MÔ TẢ */}

          <label htmlFor="moTa">Mô tả sản phẩm:</label>

          <textarea
            id="moTa"
            name="moTa"
            placeholder="Nhập mô tả sản phẩm"
            value={form.moTa}
            onChange={handleChange}
            rows="4"
          />

          {/* NÚT THAO TÁC */}

          <button type="submit" disabled={dangLuu}>
            {dangLuu
              ? "ĐANG LƯU..."
              : editingId
              ? "CẬP NHẬT SẢN PHẨM"
              : "THÊM SẢN PHẨM"}
          </button>

          {editingId && (
            <button type="button" onClick={handleCancel}>
              HỦY CHỈNH SỬA
            </button>
          )}
        </form>
      )}

      {/* DANH SÁCH SẢN PHẨM */}

      <h2>DANH SÁCH SẢN PHẨM</h2>

      <div className="product-table">
        {dangTai ? (
          <p>Đang tải danh sách sản phẩm...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Danh mục</th>
                {coQuyenQuanLy && <th>Thao tác</th>}
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    {product.hinhAnh ? (
                      <img
                        src={layDuongDanAnh(product.hinhAnh)}
                        alt={product.tenSanPham}
                        style={{
                          width: "100px",
                          height: "70px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.alt = "Ảnh bị lỗi";
                        }}
                      />
                    ) : (
                      "Chưa có ảnh"
                    )}
                  </td>

                  <td>{product.tenSanPham}</td>

                  <td>{Number(product.gia).toLocaleString("vi-VN")} đ</td>

                  <td>{product.soLuong}</td>

                  <td>{product.danhMuc}</td>

                  {coQuyenQuanLy && (
                    <td>
                      <button type="button" onClick={() => handleEdit(product)}>
                        SỬA
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                      >
                        XÓA
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={coQuyenQuanLy ? 6 : 5}>Chưa có sản phẩm nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default QuanLySanPham;

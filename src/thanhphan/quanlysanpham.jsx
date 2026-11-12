import { useEffect, useState } from "react";
import "../App.css";

// ======================================
// ĐỊA CHỈ API
// ======================================

const API = "http://localhost:5000/api/products";
const SERVER_URL = "http://localhost:5000";

// ======================================
// DANH SÁCH 4 DANH MỤC SẢN PHẨM
// ======================================

const DANH_MUC = ["Mũ", "Xe Moto", "Bánh xe", "Phụ tùng xe"];

// ======================================
// LẤY THÔNG TIN TÀI KHOẢN
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

const layUserId = () => {
  const user = layTaiKhoan();
  return user?._id || user?.id || "";
};

// ======================================
// KIỂM TRA QUYỀN ADMIN
// ======================================

const kiemTraQuyenAdmin = () => {
  const user = layTaiKhoan();

  if (!user || !(user._id || user.id)) {
    alert("Bạn cần đăng nhập để sử dụng chức năng này!");
    return false;
  }

  if (user.role !== "admin") {
    alert("Bạn không có quyền quản lý sản phẩm!");
    return false;
  }

  return true;
};

// ======================================
// QUẢN LÝ SẢN PHẨM
// ======================================

function QuanLySanPham({ dong }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [hinhAnh, setHinhAnh] = useState(null);
  const [anhCu, setAnhCu] = useState("");
  const [dangLuu, setDangLuu] = useState(false);

  const [form, setForm] = useState({
    tenSanPham: "",
    gia: "",
    moTa: "",
    soLuong: 0,
    danhMuc: "Xe Moto",
  });

  // ======================================
  // LẤY ĐƯỜNG DẪN ẢNH
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
  // LẤY DANH SÁCH SẢN PHẨM
  // ======================================

  const laySanPham = async () => {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải sản phẩm!");
      }

      const danhSach = Array.isArray(data) ? data : data.products || [];

      setProducts(danhSach);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      alert("Không thể tải sản phẩm!");
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // ======================================
  // NHẬP DỮ LIỆU
  // ======================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================
  // CHỌN ẢNH
  // ======================================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
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
  // THÊM HOẶC CẬP NHẬT SẢN PHẨM
  // ======================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dangLuu) return;

    if (!kiemTraQuyenAdmin()) return;

    if (!DANH_MUC.includes(form.danhMuc)) {
      alert("Vui lòng chọn danh mục hợp lệ!");
      return;
    }

    const userId = layUserId();

    try {
      setDangLuu(true);

      const formData = new FormData();

      formData.append("tenSanPham", form.tenSanPham.trim());
      formData.append("gia", form.gia);
      formData.append("moTa", form.moTa);
      formData.append("soLuong", form.soLuong);
      formData.append("danhMuc", form.danhMuc);

      if (hinhAnh) {
        formData.append("hinhAnh", hinhAnh);
      }

      const url = editingId ? `${API}/${editingId}` : API;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "x-user-id": userId,
        },
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
  // CHỌN SẢN PHẨM ĐỂ SỬA
  // ======================================

  const handleEdit = (product) => {
    if (!kiemTraQuyenAdmin()) return;

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
  // XÓA SẢN PHẨM
  // ======================================

  const handleDelete = async (id) => {
    if (!kiemTraQuyenAdmin()) return;

    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": layUserId(),
        },
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
  // HỦY SỬA SẢN PHẨM
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
  // ẢNH XEM TRƯỚC
  // ======================================

  const anhXemTruoc = hinhAnh ? URL.createObjectURL(hinhAnh) : "";

  useEffect(() => {
    return () => {
      if (anhXemTruoc) {
        URL.revokeObjectURL(anhXemTruoc);
      }
    };
  }, [anhXemTruoc]);

  // ======================================
  // KIỂM TRA TÀI KHOẢN
  // ======================================

  const user = layTaiKhoan();

  const coQuyenAdmin = user && (user._id || user.id) && user.role === "admin";

  // ======================================
  // GIAO DIỆN
  // ======================================

  return (
    <div className="quan-ly-san-pham">
      <h1>QUẢN LÝ SẢN PHẨM</h1>

      <button type="button" onClick={dong}>
        QUAY LẠI DASHBOARD
      </button>

      {!coQuyenAdmin && (
        <div className="thong-bao-quyen">
          <h3>Bạn không có quyền quản lý sản phẩm!</h3>
          <p>Vui lòng đăng nhập bằng tài khoản Admin.</p>
        </div>
      )}

      {/* FORM SẢN PHẨM */}

      {coQuyenAdmin && (
        <form onSubmit={handleSubmit} className="product-form">
          <h2>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2>

          {/* TÊN SẢN PHẨM */}

          <input
            name="tenSanPham"
            placeholder="Tên sản phẩm"
            value={form.tenSanPham}
            onChange={handleChange}
            required
          />

          {/* GIÁ SẢN PHẨM */}

          <input
            name="gia"
            type="number"
            placeholder="Giá sản phẩm"
            value={form.gia}
            onChange={handleChange}
            min="0"
            required
          />

          {/* SỐ LƯỢNG */}

          <input
            name="soLuong"
            type="number"
            placeholder="Số lượng"
            value={form.soLuong}
            onChange={handleChange}
            min="0"
          />

          {/* CHỌN DANH MỤC */}

          <label htmlFor="danhMuc">Chọn danh mục sản phẩm:</label>

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

          {/* CHỌN ẢNH */}

          <label>Chọn ảnh sản phẩm từ máy tính:</label>

          <input type="file" accept="image/*" onChange={handleImageChange} />

          {/* ẢNH XEM TRƯỚC */}

          {hinhAnh && (
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
                alt="Ảnh sản phẩm"
                style={{
                  width: "180px",
                  height: "140px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.alt = "Không tải được ảnh";
                }}
              />
            </div>
          )}

          {/* MÔ TẢ */}

          <textarea
            name="moTa"
            placeholder="Mô tả sản phẩm"
            value={form.moTa}
            onChange={handleChange}
          />

          {/* NÚT LƯU */}

          <button type="submit" disabled={dangLuu}>
            {dangLuu ? "ĐANG LƯU..." : editingId ? "CẬP NHẬT" : "THÊM SẢN PHẨM"}
          </button>

          {editingId && (
            <button type="button" onClick={handleCancel}>
              HỦY
            </button>
          )}
        </form>
      )}

      {/* DANH SÁCH SẢN PHẨM */}

      <h2>Danh sách sản phẩm</h2>

      <div className="product-table">
        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Danh mục</th>
              {coQuyenAdmin && <th>Thao tác</th>}
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
                        e.target.onerror = null;
                        e.target.alt = "Ảnh bị lỗi";
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

                {coQuyenAdmin && (
                  <td>
                    <button type="button" onClick={() => handleEdit(product)}>
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                    >
                      Xóa
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={coQuyenAdmin ? "6" : "5"}>Chưa có sản phẩm nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuanLySanPham;

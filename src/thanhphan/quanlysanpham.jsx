import { useEffect, useState } from "react";
import "../App.css";

const API = "http://localhost:5000/api/products";

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
    danhMuc: "Xe moto",
  });

  // Lấy danh sách sản phẩm
  const laySanPham = async () => {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải sản phẩm");
      }

      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      alert("Không thể tải sản phẩm!");
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // Nhập dữ liệu
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Chọn ảnh từ máy tính
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

  // Thêm hoặc cập nhật sản phẩm
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dangLuu) return;

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
        body: formData,
      });

      const text = await response.text();

      console.log("Backend trả về:", text);

      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || "Lỗi lưu sản phẩm");
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

  // Chọn sản phẩm để sửa
  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      tenSanPham: product.tenSanPham || "",
      gia: product.gia ?? "",
      moTa: product.moTa || "",
      soLuong: product.soLuong ?? 0,
      danhMuc: product.danhMuc || "Xe moto",
    });

    setAnhCu(product.hinhAnh || "");
    setHinhAnh(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Xóa sản phẩm thất bại");
      }

      alert("Xóa sản phẩm thành công!");
      await laySanPham();
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      alert(error.message || "Không thể kết nối server!");
    }
  };

  // Hủy sửa
  const handleCancel = () => {
    setEditingId(null);
    setHinhAnh(null);
    setAnhCu("");

    setForm({
      tenSanPham: "",
      gia: "",
      moTa: "",
      soLuong: 0,
      danhMuc: "Xe moto",
    });
  };

  // Đường dẫn ảnh
  const layDuongDanAnh = (url) => {
    if (!url) return "";

    if (url.startsWith("http")) {
      return url;
    }

    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Ảnh xem trước
  const anhXemTruoc = hinhAnh ? URL.createObjectURL(hinhAnh) : "";

  useEffect(() => {
    return () => {
      if (anhXemTruoc) {
        URL.revokeObjectURL(anhXemTruoc);
      }
    };
  }, [anhXemTruoc]);

  return (
    <div className="quan-ly-san-pham">
      <h1>QUẢN LÝ SẢN PHẨM</h1>

      <button type="button" onClick={dong}>
        QUAY LẠI DASHBOARD
      </button>

      <form onSubmit={handleSubmit} className="product-form">
        <h2>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h2>

        <input
          name="tenSanPham"
          placeholder="Tên sản phẩm"
          value={form.tenSanPham}
          onChange={handleChange}
          required
        />

        <input
          name="gia"
          type="number"
          placeholder="Giá sản phẩm"
          value={form.gia}
          onChange={handleChange}
          min="0"
          required
        />

        <input
          name="soLuong"
          type="number"
          placeholder="Số lượng"
          value={form.soLuong}
          onChange={handleChange}
          min="0"
        />

        <input
          name="danhMuc"
          placeholder="Danh mục"
          value={form.danhMuc}
          onChange={handleChange}
        />

        <label>Chọn ảnh sản phẩm từ máy tính:</label>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {hinhAnh && (
          <div>
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

        {!hinhAnh && anhCu && (
          <div>
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
            />
          </div>
        )}

        <textarea
          name="moTa"
          placeholder="Mô tả sản phẩm"
          value={form.moTa}
          onChange={handleChange}
        />

        <button type="submit" disabled={dangLuu}>
          {dangLuu ? "ĐANG LƯU..." : editingId ? "CẬP NHẬT" : "THÊM SẢN PHẨM"}
        </button>

        {editingId && (
          <button type="button" onClick={handleCancel}>
            HỦY
          </button>
        )}
      </form>

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
              <th>Thao tác</th>
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
                    />
                  ) : (
                    "Chưa có ảnh"
                  )}
                </td>

                <td>{product.tenSanPham}</td>

                <td>{Number(product.gia).toLocaleString("vi-VN")} đ</td>

                <td>{product.soLuong}</td>

                <td>{product.danhMuc}</td>

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
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan="6">Chưa có sản phẩm nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuanLySanPham;

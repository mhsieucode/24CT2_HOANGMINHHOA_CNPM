import { useEffect, useState } from "react";
import "../App.css";

// ======================================
// 1. ĐỊA CHỈ API
// ======================================

const API = "http://localhost:5000/api/products";
const SERVER_URL = "http://localhost:5000";

// ======================================
// 2. DANH MỤC VÀ THÔNG SỐ KỸ THUẬT
// ======================================

const DANH_MUC = ["Mũ", "Xe Moto", "Bánh xe", "Phụ tùng xe"];

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
// 3. XỬ LÝ THÔNG SỐ
// ======================================

const taoThongSoRong = (danhMuc) => {
  const ketQua = {};

  (THONG_SO_THEO_DANH_MUC[danhMuc] || []).forEach((ten) => {
    ketQua[ten] = "";
  });

  return ketQua;
};

const layThongSoObject = (thongSo) => {
  if (!thongSo) return {};

  if (typeof thongSo === "string") {
    try {
      thongSo = JSON.parse(thongSo);
    } catch {
      return {};
    }
  }

  if (thongSo instanceof Map) {
    return Object.fromEntries(thongSo);
  }

  if (typeof thongSo === "object" && !Array.isArray(thongSo)) {
    return { ...thongSo };
  }

  return {};
};

const chuanHoaTen = (chuoi) => {
  return String(chuoi || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const layGiaTriThongSo = (thongSo, tenCanTim) => {
  const object = layThongSoObject(thongSo);

  if (object[tenCanTim] !== undefined) {
    return String(object[tenCanTim] ?? "");
  }

  const tenChuan = chuanHoaTen(tenCanTim);

  const keyTimThay = Object.keys(object).find(
    (key) => chuanHoaTen(key) === tenChuan
  );

  return keyTimThay !== undefined ? String(object[keyTimThay] ?? "") : "";
};

// ======================================
// 4. TÀI KHOẢN
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
// 5. COMPONENT QUẢN LÝ SẢN PHẨM
// ======================================

function QuanLySanPham({ dong }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [hinhAnh, setHinhAnh] = useState(null);
  const [anhCu, setAnhCu] = useState("");
  const [anhXemTruoc, setAnhXemTruoc] = useState("");

  const [dangLuu, setDangLuu] = useState(false);

  const [form, setForm] = useState({
    tenSanPham: "",
    gia: "",
    moTa: "",
    soLuong: 0,
    danhMuc: "Xe Moto",
  });

  const [thongSo, setThongSo] = useState(() => taoThongSoRong("Xe Moto"));

  // ======================================
  // 6. ĐƯỜNG DẪN ẢNH
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
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tải sản phẩm!");
      }

      const danhSach = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      console.log("DANH SÁCH SẢN PHẨM:", danhSach);

      console.table(
        danhSach.map((item) => ({
          tenSanPham: item.tenSanPham,
          danhMuc: item.danhMuc,
          thongSoKyThuat: JSON.stringify(
            layThongSoObject(item.thongSoKyThuat || item.thongSo)
          ),
        }))
      );

      setProducts(danhSach);

      return danhSach;
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
      alert(error.message || "Không thể tải sản phẩm!");
      return [];
    }
  };

  useEffect(() => {
    laySanPham();
  }, []);

  // ======================================
  // 8. THAY ĐỔI THÔNG TIN SẢN PHẨM
  // ======================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "danhMuc") {
      setThongSo(taoThongSoRong(value));
    }
  };

  const handleThongSoChange = (ten, giaTri) => {
    setThongSo((prev) => ({
      ...prev,
      [ten]: giaTri,
    }));
  };

  // ======================================
  // 9. CHỌN ẢNH
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
  // 10. THÊM VÀ CẬP NHẬT SẢN PHẨM
  // ======================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dangLuu) return;

    if (!kiemTraQuyenAdmin()) return;

    if (!form.tenSanPham.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (
      form.gia === "" ||
      !Number.isFinite(Number(form.gia)) ||
      Number(form.gia) < 0
    ) {
      alert("Vui lòng nhập giá sản phẩm hợp lệ!");
      return;
    }

    if (!Number.isFinite(Number(form.soLuong)) || Number(form.soLuong) < 0) {
      alert("Vui lòng nhập số lượng hợp lệ!");
      return;
    }

    if (!DANH_MUC.includes(form.danhMuc)) {
      alert("Vui lòng chọn danh mục hợp lệ!");
      return;
    }

    // Lấy các thông số có nhập dữ liệu
    const danhSachTen = THONG_SO_THEO_DANH_MUC[form.danhMuc] || [];

    const thongSoHopLe = {};

    danhSachTen.forEach((ten) => {
      const giaTri = String(thongSo[ten] ?? "").trim();

      if (giaTri !== "") {
        thongSoHopLe[ten] = giaTri;
      }
    });

    const userId = layUserId();

    if (!userId) {
      alert("Không tìm thấy tài khoản đăng nhập!");
      return;
    }

    try {
      setDangLuu(true);

      const formData = new FormData();

      formData.append("tenSanPham", form.tenSanPham.trim());
      formData.append("gia", String(form.gia));
      formData.append("moTa", form.moTa);
      formData.append("soLuong", String(form.soLuong));
      formData.append("danhMuc", form.danhMuc);

      // Gửi đồng thời hai tên trường để tương thích
      formData.append("thongSoKyThuat", JSON.stringify(thongSoHopLe));

      formData.append("thongSo", JSON.stringify(thongSoHopLe));

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

      console.log("PHẢN HỒI SERVER:", data);

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
  // 11. SỬA SẢN PHẨM
  // ======================================

  const handleEdit = (product) => {
    if (!kiemTraQuyenAdmin()) return;

    const danhMuc = DANH_MUC.includes(product.danhMuc)
      ? product.danhMuc
      : "Xe Moto";

    const thongSoCu = layThongSoObject(
      product.thongSoKyThuat || product.thongSo
    );

    const thongSoMoi = taoThongSoRong(danhMuc);

    Object.keys(thongSoMoi).forEach((ten) => {
      thongSoMoi[ten] = layGiaTriThongSo(thongSoCu, ten);
    });

    setEditingId(product._id);

    setForm({
      tenSanPham: product.tenSanPham || "",
      gia: product.gia ?? "",
      moTa: product.moTa || "",
      soLuong: product.soLuong ?? 0,
      danhMuc,
    });

    setThongSo(thongSoMoi);
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
  // 13. HỦY VÀ LÀM MỚI FORM
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

    setThongSo(taoThongSoRong("Xe Moto"));
  };

  // ======================================
  // 14. KIỂM TRA QUYỀN
  // ======================================

  const user = layTaiKhoan();

  const coQuyenAdmin = user && (user._id || user.id) && user.role === "admin";

  const danhSachThongSo = THONG_SO_THEO_DANH_MUC[form.danhMuc] || [];

  // ======================================
  // 15. GIAO DIỆN
  // ======================================

  return (
    <div className="quan-ly-san-pham">
      <h1>QUẢN LÝ SẢN PHẨM</h1>

      {!coQuyenAdmin && (
        <div className="thong-bao-quyen">
          <h3>Bạn không có quyền quản lý sản phẩm!</h3>
          <p>Vui lòng đăng nhập bằng tài khoản Admin.</p>
        </div>
      )}

      {coQuyenAdmin && (
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

          <label>Chọn ảnh sản phẩm từ máy tính:</label>

          <input type="file" accept="image/*" onChange={handleImageChange} />

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

          <textarea
            name="moTa"
            placeholder="Mô tả sản phẩm"
            value={form.moTa}
            onChange={handleChange}
          />

          {/* THÔNG SỐ KỸ THUẬT */}

          <div className="thong-so-form">
            <h3>Thông số kỹ thuật sản phẩm</h3>

            <p>
              Danh mục: <strong>{form.danhMuc}</strong>
            </p>

            {danhSachThongSo.map((ten) => (
              <div className="thong-so-row" key={ten}>
                <label>{ten}:</label>

                <input
                  type="text"
                  placeholder={`Nhập ${ten.toLowerCase()}`}
                  value={thongSo[ten] || ""}
                  onChange={(e) => handleThongSoChange(ten, e.target.value)}
                />
              </div>
            ))}
          </div>

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
              <th>Thông số</th>
              {coQuyenAdmin && <th>Thao tác</th>}
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const thongSoSanPham = layThongSoObject(
                product.thongSoKyThuat || product.thongSo
              );

              const tenThongSo = THONG_SO_THEO_DANH_MUC[product.danhMuc] || [];

              const cacThongSo = tenThongSo
                .map((ten) => [ten, layGiaTriThongSo(thongSoSanPham, ten)])
                .filter(([, giaTri]) => String(giaTri).trim() !== "");

              return (
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

                  <td>
                    {cacThongSo.length > 0 ? (
                      <div>
                        {cacThongSo.map(([ten, giaTri]) => (
                          <div key={ten}>
                            <strong>{ten}:</strong> {giaTri}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "Chưa có"
                    )}
                  </td>

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
              );
            })}

            {products.length === 0 && (
              <tr>
                <td colSpan={coQuyenAdmin ? "7" : "6"}>Chưa có sản phẩm nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuanLySanPham;

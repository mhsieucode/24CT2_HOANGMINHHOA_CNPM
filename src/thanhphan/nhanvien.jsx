function NhanVien({ user, dangXuat }) {
  return (
    <div className="nhanvien-page">
      {/* HEADER */}
      <div className="nhanvien-header">
        <div>
          <h1>NHÂN VIÊN MOTO SHOP</h1>
          <p>
            Xin chào, <strong>{user?.hoTen}</strong>
          </p>
        </div>

        <button className="nhanvien-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* MENU */}
      <div className="nhanvien-menu">
        <div className="nhanvien-card">
          <div className="nhanvien-icon">📦</div>
          <h2>Quản lý sản phẩm</h2>
          <p>Xem và cập nhật thông tin sản phẩm trong cửa hàng.</p>
          <button>QUẢN LÝ</button>
        </div>

        <div className="nhanvien-card">
          <div className="nhanvien-icon">🛒</div>
          <h2>Quản lý đơn hàng</h2>
          <p>Kiểm tra và cập nhật trạng thái đơn hàng của khách.</p>
          <button>QUẢN LÝ</button>
        </div>

        <div className="nhanvien-card">
          <div className="nhanvien-icon">👥</div>
          <h2>Khách hàng</h2>
          <p>Xem thông tin khách hàng và hỗ trợ khách hàng.</p>
          <button>XEM</button>
        </div>
      </div>
    </div>
  );
}

export default NhanVien;

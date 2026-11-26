import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import QuanLyDonHang from "./quanlydonhang";
import QuanLySanPham from "./quanlysanpham";

// ======================================================
// CẤU HÌNH BACKEND
// ======================================================

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

// ======================================================
// ĐỌC DỮ LIỆU SERVER
// ======================================================

async function docPhanHoi(response) {
  const noiDung = await response.text();

  if (!noiDung) return {};

  try {
    return JSON.parse(noiDung);
  } catch {
    throw new Error("Dữ liệu server trả về không hợp lệ.");
  }
}

function layThongBaoLoi(data, macDinh) {
  return data?.message || data?.error || macDinh;
}

// ======================================================
// COMPONENT ADMIN
// ======================================================

function Admin({ user, dangXuat }) {
  const socketRef = useRef(null);
  const khungTinNhanRef = useRef(null);
  const cuocTroChuyenRef = useRef(null);
  const cuocTroChuyenThongBaoRef = useRef(null);
  const liveChatRef = useRef(null);
  const thongBaoChatRef = useRef(null);

  // ÂM THANH THÔNG BÁO
  const audioContextRef = useRef(null);
  const amThanhDaMoKhoaRef = useRef(false);

  const userId = String(user?._id || user?.id || "");

  // ------------------------------------------------------
  // KHỞI TẠO VÀ PHÁT ÂM THANH
  // ------------------------------------------------------

  const khoiTaoAmThanh = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      amThanhDaMoKhoaRef.current = true;
    } catch (error) {
      console.warn("Không thể khởi tạo âm thanh:", error);
    }
  };

  const phatAmThanhThongBao = async () => {
    try {
      const audioContext = audioContextRef.current;

      if (!audioContext || !amThanhDaMoKhoaRef.current) return;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const thoiDiem = audioContext.currentTime;

      [880, 1175].forEach((tanSo, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        const batDau = thoiDiem + index * 0.2;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(tanSo, batDau);

        gainNode.gain.setValueAtTime(0.0001, batDau);
        gainNode.gain.exponentialRampToValueAtTime(0.25, batDau + 0.025);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, batDau + 0.16);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(batDau);
        oscillator.stop(batDau + 0.17);
      });
    } catch (error) {
      console.warn("Lỗi phát âm thanh thông báo:", error);
    }
  };

  // Mở khóa âm thanh khi Admin tương tác với trang
  useEffect(() => {
    const moKhoa = () => {
      khoiTaoAmThanh();
    };

    window.addEventListener("pointerdown", moKhoa);
    window.addEventListener("keydown", moKhoa);

    return () => {
      window.removeEventListener("pointerdown", moKhoa);
      window.removeEventListener("keydown", moKhoa);
    };
  }, []);

  // Đóng AudioContext khi rời trang Admin
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------
  // QUẢN LÝ TÀI KHOẢN
  // ------------------------------------------------------

  const [danhSachUser, setDanhSachUser] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loiTaiUser, setLoiTaiUser] = useState("");

  // ------------------------------------------------------
  // ĐIỀU KHIỂN KHU VỰC
  // ------------------------------------------------------

  const [hienQuanLyUser, setHienQuanLyUser] = useState(false);
  const [hienQuanLySanPham, setHienQuanLySanPham] = useState(false);
  const [hienQuanLyDonHang, setHienQuanLyDonHang] = useState(false);
  const [hienThongKe, setHienThongKe] = useState(false);
  const [hienLiveChat, setHienLiveChat] = useState(false);

  // ------------------------------------------------------
  // THỐNG KÊ
  // ------------------------------------------------------

  const [dangTaiThongKe, setDangTaiThongKe] = useState(false);
  const [loiThongKe, setLoiThongKe] = useState("");

  const [thongKe, setThongKe] = useState({
    tongDoanhThu: 0,
    soLuongSanPham: 0,
    soLuongBaiDang: 0,
  });

  // ------------------------------------------------------
  // LIVE CHAT
  // ------------------------------------------------------

  const [danhSachCuocTroChuyen, setDanhSachCuocTroChuyen] = useState([]);
  const [cuocTroChuyenDangChon, setCuocTroChuyenDangChon] = useState(null);
  const [danhSachTinNhan, setDanhSachTinNhan] = useState([]);
  const [noiDungTraLoi, setNoiDungTraLoi] = useState("");
  const [dangTaiChat, setDangTaiChat] = useState(false);
  const [dangGuiTin, setDangGuiTin] = useState(false);
  const [loiChat, setLoiChat] = useState("");
  const [trangThaiSocket, setTrangThaiSocket] = useState(false);

  const [soTinNhanMoi, setSoTinNhanMoi] = useState(0);
  const [thongBaoChat, setThongBaoChat] = useState("");

  // ======================================================
  // 1. LẤY DANH SÁCH TÀI KHOẢN
  // ======================================================

  const layDanhSachUser = useCallback(async () => {
    if (!userId) {
      setLoiTaiUser("Không tìm thấy thông tin người đăng nhập.");
      setDanhSachUser([]);
      return;
    }

    try {
      setDangTai(true);
      setLoiTaiUser("");

      const response = await fetch(`${API}/api/admin/users`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể lấy danh sách tài khoản!")
        );
      }

      const users = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      setDanhSachUser(users);
    } catch (error) {
      console.error("Lỗi lấy danh sách tài khoản:", error);
      setLoiTaiUser(error.message || "Không thể kết nối đến server.");
    } finally {
      setDangTai(false);
    }
  }, [userId]);

  useEffect(() => {
    layDanhSachUser();
  }, [layDanhSachUser]);

  // ======================================================
  // 2. LẤY THỐNG KÊ
  // ======================================================

  const layThongKe = useCallback(async () => {
    if (!userId) {
      setLoiThongKe("Không tìm thấy thông tin tài khoản Admin!");
      return;
    }

    try {
      setDangTaiThongKe(true);
      setLoiThongKe("");

      const response = await fetch(`${API}/api/admin/thong-ke`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể lấy dữ liệu thống kê!")
        );
      }

      if (data?.success === false) {
        throw new Error(data.message || "Lấy dữ liệu thống kê thất bại!");
      }

      setThongKe({
        tongDoanhThu: Number(data?.tongDoanhThu) || 0,
        soLuongSanPham: Number(data?.soLuongSanPham) || 0,
        soLuongBaiDang: Number(data?.soLuongBaiDang) || 0,
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê:", error);
      setLoiThongKe(error.message || "Không thể kết nối đến server!");
    } finally {
      setDangTaiThongKe(false);
    }
  }, [userId]);

  const moThongKe = () => {
    const trangThaiMoi = !hienThongKe;
    setHienThongKe(trangThaiMoi);

    if (trangThaiMoi) layThongKe();
  };

  // ======================================================
  // 3. ĐỔI QUYỀN TÀI KHOẢN
  // ======================================================

  const doiQuyen = async (id, roleMoi) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    const taiKhoanDangSua = danhSachUser.find(
      (item) => String(item._id || item.id) === String(id)
    );

    if (
      String(id) === userId &&
      taiKhoanDangSua?.role === "admin" &&
      roleMoi !== "admin"
    ) {
      alert("Bạn không thể tự hạ quyền admin của mình!");
      await layDanhSachUser();
      return;
    }

    try {
      const response = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ role: roleMoi }),
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(layThongBaoLoi(data, "Không thể đổi quyền!"));
      }

      alert("Đổi quyền tài khoản thành công!");
      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi đổi quyền:", error);
      alert(error.message || "Không thể kết nối đến server!");
      await layDanhSachUser();
    }
  };

  // ======================================================
  // 4. XÓA TÀI KHOẢN
  // ======================================================

  const xoaUser = async (id, hoTen) => {
    if (!userId) {
      alert("Không tìm thấy thông tin người đăng nhập!");
      return;
    }

    if (String(id) === userId) {
      alert("Bạn không thể tự xóa tài khoản đang đăng nhập!");
      return;
    }

    const xacNhan = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${hoTen || "này"}" không?`
    );

    if (!xacNhan) return;

    try {
      const response = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-user-id": userId,
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(layThongBaoLoi(data, "Không thể xóa tài khoản!"));
      }

      alert("Xóa tài khoản thành công!");
      await layDanhSachUser();
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      alert(error.message || "Không thể kết nối đến server!");
    }
  };

  const hienThiRole = (role) => {
    if (role === "admin") return "ADMIN";
    if (role === "staff") return "NHÂN VIÊN";
    return "KHÁCH HÀNG";
  };

  // ======================================================
  // 5. LIVE CHAT - LẤY DANH SÁCH CUỘC TRÒ CHUYỆN
  // ======================================================

  const layDanhSachCuocTroChuyen = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/chat/admin/conversations`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể tải danh sách cuộc trò chuyện.")
        );
      }

      const danhSach = Array.isArray(data)
        ? data
        : Array.isArray(data?.conversations)
        ? data.conversations
        : [];

      setDanhSachCuocTroChuyen(danhSach);
      setLoiChat("");

      return danhSach;
    } catch (error) {
      console.error("Lỗi lấy danh sách Live Chat:", error);
      setLoiChat(error.message || "Không thể tải danh sách tin nhắn.");
      return [];
    }
  }, []);

  // ======================================================
  // ĐÓNG / MỞ LIVE CHAT
  // ======================================================

  const dongMoLiveChat = () => {
    const trangThaiMoi = !hienLiveChat;

    setHienLiveChat(trangThaiMoi);

    if (trangThaiMoi) {
      setSoTinNhanMoi(0);
      layDanhSachCuocTroChuyen();
    }
  };

  // ======================================================
  // 6. LIVE CHAT - TẢI LỊCH SỬ TIN NHẮN
  // ======================================================

  const moCuocTroChuyen = async (cuocTroChuyen) => {
    const conversationId =
      cuocTroChuyen?.conversationId || cuocTroChuyen?._id || cuocTroChuyen?.id;

    if (!conversationId) {
      setLoiChat("Không tìm thấy mã cuộc trò chuyện.");
      return;
    }

    const cuocTroChuyenMoi = {
      ...cuocTroChuyen,
      conversationId: String(conversationId),
    };

    cuocTroChuyenRef.current = cuocTroChuyenMoi;

    setCuocTroChuyenDangChon(cuocTroChuyenMoi);
    setDanhSachTinNhan([]);
    setLoiChat("");
    setDangTaiChat(true);

    try {
      const response = await fetch(
        `${API}/api/chat/history/${encodeURIComponent(conversationId)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể tải lịch sử trò chuyện.")
        );
      }

      const messages = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.history)
        ? data.history
        : [];

      setDanhSachTinNhan(messages);

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", String(conversationId));
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử Live Chat:", error);
      setLoiChat(error.message || "Không thể tải lịch sử trò chuyện.");
    } finally {
      setDangTaiChat(false);
    }
  };

  // ======================================================
  // 7. BẤM THÔNG BÁO - MỞ ĐÚNG CUỘC TRÒ CHUYỆN
  // ======================================================

  const xemTinNhanThongBao = async () => {
    setThongBaoChat("");

    if (thongBaoChatRef.current) {
      clearTimeout(thongBaoChatRef.current);
      thongBaoChatRef.current = null;
    }

    setSoTinNhanMoi(0);
    setHienLiveChat(true);

    const danhSach = await layDanhSachCuocTroChuyen();
    const thongTinThongBao = cuocTroChuyenThongBaoRef.current;

    const idThongBao =
      typeof thongTinThongBao === "object"
        ? thongTinThongBao?.conversationId
        : thongTinThongBao;

    let cuocTroChuyen = danhSach.find((item) => {
      const id = item.conversationId || item._id || item.id;
      return idThongBao && String(id) === String(idThongBao);
    });

    if (!cuocTroChuyen && thongTinThongBao?.customerId) {
      cuocTroChuyen = danhSach.find((item) => {
        const customerId =
          item.customerId ||
          item.userId ||
          item.customer?._id ||
          item.user?._id;

        return (
          customerId &&
          String(customerId) === String(thongTinThongBao.customerId)
        );
      });
    }

    if (!cuocTroChuyen && thongTinThongBao?.email) {
      cuocTroChuyen = danhSach.find((item) => {
        const email = item.email || item.customer?.email || item.user?.email;

        return (
          email &&
          String(email).toLowerCase() ===
            String(thongTinThongBao.email).toLowerCase()
        );
      });
    }

    if (!cuocTroChuyen && danhSach.length > 0) {
      cuocTroChuyen = danhSach[0];
    }

    if (cuocTroChuyen) {
      await moCuocTroChuyen(cuocTroChuyen);
      cuocTroChuyenThongBaoRef.current = null;
    } else {
      console.warn("Không tìm thấy cuộc trò chuyện cần mở.");
      setLoiChat("Không tìm thấy cuộc trò chuyện vừa gửi tin nhắn.");
    }
  };

  // ======================================================
  // TỰ ĐỘNG CUỘN ĐẾN LIVE CHAT
  // ======================================================

  useEffect(() => {
    if (hienLiveChat && liveChatRef.current) {
      const timer = setTimeout(() => {
        liveChatRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [hienLiveChat]);

  // ======================================================
  // TỰ ĐỘNG CUỘN ĐẾN TIN NHẮN CUỐI
  // ======================================================

  useEffect(() => {
    if (khungTinNhanRef.current) {
      khungTinNhanRef.current.scrollTop = khungTinNhanRef.current.scrollHeight;
    }
  }, [danhSachTinNhan]);

  // ======================================================
  // 8. LIVE CHAT - GỬI TIN NHẮN TRẢ LỜI
  // ======================================================

  const guiTraLoiChat = async (e) => {
    e.preventDefault();

    const content = noiDungTraLoi.trim();
    const conversationId = cuocTroChuyenDangChon?.conversationId;

    if (!content || !conversationId || dangGuiTin) return;

    try {
      setDangGuiTin(true);

      const response = await fetch(`${API}/api/chat/admin/reply`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      });

      const data = await docPhanHoi(response);

      if (!response.ok) {
        throw new Error(
          layThongBaoLoi(data, "Không thể gửi tin nhắn trả lời.")
        );
      }

      const tinNhanMoi = data?.adminMessage || data?.messageData;

      if (tinNhanMoi) {
        setDanhSachTinNhan((cu) => {
          if (
            tinNhanMoi._id &&
            cu.some((item) => String(item._id) === String(tinNhanMoi._id))
          ) {
            return cu;
          }

          return [...cu, tinNhanMoi];
        });
      } else {
        await moCuocTroChuyen(cuocTroChuyenDangChon);
      }

      setNoiDungTraLoi("");
      await layDanhSachCuocTroChuyen();
    } catch (error) {
      console.error("Lỗi gửi trả lời Live Chat:", error);
      alert(error.message || "Không thể gửi tin nhắn.");
    } finally {
      setDangGuiTin(false);
    }
  };

  // ======================================================
  // 9. KẾT NỐI SOCKET ADMIN
  // ======================================================

  useEffect(() => {
    if (!userId) return;

    const socket = io(API, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("MH MOTO ADMIN CHAT SOCKET ĐÃ KẾT NỐI:", socket.id);

      setTrangThaiSocket(true);
      socket.emit("chat:admin:join");

      layDanhSachCuocTroChuyen();

      const cuocTroChuyenHienTai = cuocTroChuyenRef.current;

      if (cuocTroChuyenHienTai?.conversationId) {
        socket.emit("chat:join", cuocTroChuyenHienTai.conversationId);
      }
    });

    socket.on("disconnect", (reason) => {
      setTrangThaiSocket(false);
      console.log("MH MOTO ADMIN CHAT SOCKET ĐÃ NGẮT KẾT NỐI:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Lỗi Socket Admin:", error.message);
      setTrangThaiSocket(false);
    });

    // KHÁCH HÀNG GỬI TIN NHẮN MỚI
    socket.on("chat:new-message", (payload) => {
      console.log("Có tin nhắn mới từ khách hàng!", payload);

      // PHÁT ÂM THANH THÔNG BÁO
      phatAmThanhThongBao();

      const tinNhan =
        payload?.messageData || payload?.message || payload?.data || payload;

      const conversationId =
        payload?.conversationId ||
        tinNhan?.conversationId ||
        payload?.conversation?._id ||
        payload?.conversation?.conversationId;

      const customerId =
        payload?.customerId ||
        payload?.userId ||
        payload?.customer?._id ||
        payload?.user?._id ||
        tinNhan?.userId ||
        tinNhan?.senderId;

      const email =
        payload?.email || payload?.customer?.email || payload?.user?.email;

      const hoTen =
        payload?.hoTen ||
        payload?.customerName ||
        payload?.customer?.hoTen ||
        payload?.user?.hoTen ||
        "Khách hàng";

      cuocTroChuyenThongBaoRef.current = {
        conversationId: conversationId ? String(conversationId) : null,
        customerId: customerId ? String(customerId) : null,
        email: email || null,
        hoTen,
      };

      const noiDung =
        tinNhan?.content ||
        payload?.content ||
        "Khách hàng vừa gửi một tin nhắn mới.";

      setSoTinNhanMoi((cu) => cu + 1);
      setThongBaoChat(`${hoTen}: ${noiDung}`);

      if (thongBaoChatRef.current) {
        clearTimeout(thongBaoChatRef.current);
      }

      thongBaoChatRef.current = setTimeout(() => {
        setThongBaoChat("");
      }, 7000);

      layDanhSachCuocTroChuyen();
    });

    // NHẬN TIN NHẮN TRONG CUỘC HỘI THOẠI
    socket.on("chat:receive", (payload) => {
      const tinNhan =
        payload?.adminMessage ||
        payload?.messageData ||
        payload?.message ||
        payload?.data ||
        payload;

      const conversationId = payload?.conversationId || tinNhan?.conversationId;

      const cuocTroChuyenHienTai = cuocTroChuyenRef.current;

      if (!tinNhan || !conversationId) return;

      if (
        !cuocTroChuyenHienTai?.conversationId ||
        String(conversationId) !== String(cuocTroChuyenHienTai.conversationId)
      ) {
        layDanhSachCuocTroChuyen();
        return;
      }

      setDanhSachTinNhan((cu) => {
        if (
          tinNhan._id &&
          cu.some((item) => String(item._id) === String(tinNhan._id))
        ) {
          return cu;
        }

        return [...cu, tinNhan];
      });

      layDanhSachCuocTroChuyen();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("chat:new-message");
      socket.off("chat:receive");

      if (thongBaoChatRef.current) {
        clearTimeout(thongBaoChatRef.current);
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, layDanhSachCuocTroChuyen]);

  // ======================================================
  // 10. GIAO DIỆN ADMIN
  // ======================================================

  return (
    <div className="admin-page">
      {/* THÔNG BÁO TIN NHẮN MỚI */}

      {thongBaoChat && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 99999,
            width: "min(360px, calc(100vw - 40px))",
            padding: "16px",
            background: "#171717",
            color: "#fff",
            border: "1px solid #e10600",
            borderLeft: "5px solid #e10600",
            borderRadius: "10px",
            boxShadow: "0 5px 25px rgba(0,0,0,0.4)",
          }}
        >
          <strong style={{ color: "#ff3333" }}>🔔 TIN NHẮN MỚI</strong>

          <p style={{ margin: "8px 0", overflowWrap: "anywhere" }}>
            {thongBaoChat}
          </p>

          <button
            type="button"
            onClick={xemTinNhanThongBao}
            style={{
              padding: "8px 14px",
              background: "#e10600",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            XEM TIN NHẮN
          </button>
        </div>
      )}

      {/* HEADER ADMIN */}

      <div className="admin-header">
        <div>
          <h1>ADMIN</h1>
          <p>
            Xin chào, <strong>{user?.hoTen || "Admin"}</strong>
          </p>
          <p>Quyền: ADMIN</p>
        </div>

        <button type="button" className="admin-logout" onClick={dangXuat}>
          ĐĂNG XUẤT
        </button>
      </div>

      {/* CÁC THẺ CHỨC NĂNG */}

      <div className="admin-menu">
        <div className="admin-card">
          <div className="admin-icon">👤</div>
          <h2>Quản lý tài khoản</h2>
          <button type="button" onClick={() => setHienQuanLyUser((cu) => !cu)}>
            {hienQuanLyUser ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-icon">📦</div>
          <h2>Quản lý sản phẩm</h2>
          <button
            type="button"
            onClick={() => setHienQuanLySanPham((cu) => !cu)}
          >
            {hienQuanLySanPham ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-icon">🛒</div>
          <h2>Quản lý đơn hàng</h2>
          <button
            type="button"
            onClick={() => setHienQuanLyDonHang((cu) => !cu)}
          >
            {hienQuanLyDonHang ? "ĐÓNG QUẢN LÝ" : "QUẢN LÝ"}
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-icon">📊</div>
          <h2>Thống kê</h2>
          <button type="button" onClick={moThongKe}>
            {hienThongKe ? "ĐÓNG THỐNG KÊ" : "XEM THỐNG KÊ"}
          </button>
        </div>

        {/* THẺ LIVE CHAT */}

        <div className="admin-card">
          <div className="admin-icon">💬</div>
          <h2>Live Chat khách hàng</h2>

          <p style={{ fontSize: "13px", margin: "5px 0 12px" }}>
            {trangThaiSocket ? "● Đang kết nối" : "● Đang kết nối lại..."}
          </p>

          <button
            type="button"
            onClick={dongMoLiveChat}
            style={{ position: "relative" }}
          >
            {hienLiveChat ? "ĐÓNG LIVE CHAT" : "MỞ LIVE CHAT"}

            {soTinNhanMoi > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "22px",
                  height: "22px",
                  padding: "0 6px",
                  marginLeft: "8px",
                  borderRadius: "50px",
                  background: "#ff2020",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {soTinNhanMoi > 99 ? "99+" : soTinNhanMoi}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* QUẢN LÝ SẢN PHẨM */}

      {hienQuanLySanPham && (
        <div className="admin-products">
          <QuanLySanPham dong={() => setHienQuanLySanPham(false)} />
        </div>
      )}

      {/* QUẢN LÝ ĐƠN HÀNG */}

      {hienQuanLyDonHang && (
        <div className="admin-orders">
          <QuanLyDonHang />
        </div>
      )}

      {/* THỐNG KÊ */}

      {hienThongKe && (
        <div className="admin-statistics">
          <div className="admin-statistics-header">
            <div>
              <h2>THỐNG KÊ WEBSITE MH MOTO</h2>
              <p>Tổng hợp dữ liệu hoạt động của website.</p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={layThongKe}
              disabled={dangTaiThongKe}
            >
              {dangTaiThongKe ? "ĐANG TẢI..." : "🔄 LÀM MỚI"}
            </button>
          </div>

          {dangTaiThongKe ? (
            <div className="admin-loading">Đang tải dữ liệu thống kê...</div>
          ) : loiThongKe ? (
            <div className="admin-statistics-error">
              {loiThongKe}
              <button type="button" onClick={layThongKe}>
                THỬ LẠI
              </button>
            </div>
          ) : (
            <div className="admin-statistics-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">💰</div>
                <div>
                  <p>TỔNG DOANH THU</p>
                  <h3>{thongKe.tongDoanhThu.toLocaleString("vi-VN")} đ</h3>
                  <span>Đơn hàng đã hoàn thành</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">🏍️</div>
                <div>
                  <p>SỐ LƯỢNG SẢN PHẨM</p>
                  <h3>{thongKe.soLuongSanPham}</h3>
                  <span>Tổng sản phẩm trong hệ thống</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">📝</div>
                <div>
                  <p>SỐ BÀI ĐĂNG SẢN PHẨM</p>
                  <h3>{thongKe.soLuongBaiDang}</h3>
                  <span>Tổng sản phẩm đã đăng bán</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIVE CHAT ADMIN */}

      {hienLiveChat && (
        <div
          ref={liveChatRef}
          className="admin-live-chat"
          style={{
            marginTop: "25px",
            padding: "20px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "12px",
            color: "#fff",
            scrollMarginTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ color: "#e10600", margin: 0 }}>
                💬 LIVE CHAT MH MOTO
              </h2>
              <p style={{ color: "#aaa", marginBottom: 0 }}>
                Quản lý và trả lời tin nhắn khách hàng
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={layDanhSachCuocTroChuyen}
            >
              🔄 LÀM MỚI
            </button>
          </div>

          {loiChat && (
            <div
              className="admin-statistics-error"
              style={{ marginBottom: 15 }}
            >
              {loiChat}
              <button type="button" onClick={layDanhSachCuocTroChuyen}>
                THỬ LẠI
              </button>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 320px) minmax(0, 1fr)",
              gap: "15px",
            }}
          >
            {/* DANH SÁCH KHÁCH HÀNG */}

            <div
              style={{
                background: "#191919",
                border: "1px solid #333",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <h3
                style={{
                  padding: "15px",
                  margin: 0,
                  borderBottom: "1px solid #333",
                  color: "#fff",
                }}
              >
                KHÁCH HÀNG ({danhSachCuocTroChuyen.length})
              </h3>

              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {danhSachCuocTroChuyen.length === 0 ? (
                  <p style={{ padding: "15px", color: "#aaa" }}>
                    Chưa có cuộc trò chuyện nào.
                  </p>
                ) : (
                  danhSachCuocTroChuyen.map((item, index) => {
                    const id = item.conversationId || item._id || item.id;

                    const dangChon =
                      String(cuocTroChuyenDangChon?.conversationId) ===
                      String(id);

                    return (
                      <button
                        key={String(id || index)}
                        type="button"
                        onClick={() => moCuocTroChuyen(item)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "14px",
                          border: "none",
                          borderBottom: "1px solid #333",
                          background: dangChon ? "#292020" : "transparent",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            color: "#e10600",
                          }}
                        >
                          {item.hoTen ||
                            item.customerName ||
                            item.customer?.hoTen ||
                            item.user?.hoTen ||
                            item.email ||
                            item.customer?.email ||
                            item.user?.email ||
                            "Khách hàng"}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            color: "#aaa",
                            fontSize: "12px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {item.lastMessage?.content ||
                            item.lastMessage ||
                            item.content ||
                            "Mở cuộc trò chuyện"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* KHUNG TIN NHẮN */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: "480px",
                background: "#191919",
                border: "1px solid #333",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "15px",
                  borderBottom: "1px solid #333",
                }}
              >
                <strong>
                  {cuocTroChuyenDangChon
                    ? cuocTroChuyenDangChon.hoTen ||
                      cuocTroChuyenDangChon.customerName ||
                      cuocTroChuyenDangChon.user?.hoTen ||
                      cuocTroChuyenDangChon.email ||
                      "Đang trò chuyện với khách hàng"
                    : "CHỌN MỘT CUỘC TRÒ CHUYỆN"}
                </strong>
              </div>

              <div
                ref={khungTinNhanRef}
                style={{
                  flex: 1,
                  minHeight: "350px",
                  maxHeight: "500px",
                  overflowY: "auto",
                  padding: "15px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {!cuocTroChuyenDangChon ? (
                  <p
                    style={{
                      color: "#aaa",
                      textAlign: "center",
                      margin: "auto",
                    }}
                  >
                    Chọn khách hàng bên trái để xem tin nhắn.
                  </p>
                ) : dangTaiChat ? (
                  <p style={{ color: "#aaa", textAlign: "center" }}>
                    Đang tải tin nhắn...
                  </p>
                ) : danhSachTinNhan.length === 0 ? (
                  <p style={{ color: "#aaa", textAlign: "center" }}>
                    Chưa có tin nhắn.
                  </p>
                ) : (
                  danhSachTinNhan.map((tin, index) => {
                    const laAdmin = tin.sender === "admin";
                    const laBot = tin.sender === "bot";

                    return (
                      <div
                        key={tin._id || `${tin.sender}-${index}`}
                        style={{
                          alignSelf: laAdmin ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          padding: "10px 13px",
                          borderRadius: "10px",
                          background: laAdmin
                            ? "#a80700"
                            : laBot
                            ? "#333"
                            : "#242424",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <small
                          style={{
                            display: "block",
                            marginBottom: "5px",
                            color: "#ddd",
                            fontWeight: "bold",
                          }}
                        >
                          {laAdmin
                            ? "NHÂN VIÊN MH MOTO"
                            : laBot
                            ? "CHATBOT MH MOTO"
                            : "KHÁCH HÀNG"}
                        </small>

                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {tin.content}
                        </div>

                        <small
                          style={{
                            display: "block",
                            marginTop: "6px",
                            color: "#ddd",
                            fontSize: "10px",
                          }}
                        >
                          {tin.createdAt
                            ? new Date(tin.createdAt).toLocaleString("vi-VN")
                            : ""}
                        </small>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Ô NHẬP VÀ GỬI TIN */}

              <form
                onSubmit={guiTraLoiChat}
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px",
                  borderTop: "1px solid #333",
                }}
              >
                <input
                  type="text"
                  value={noiDungTraLoi}
                  onChange={(e) => setNoiDungTraLoi(e.target.value)}
                  placeholder={
                    cuocTroChuyenDangChon
                      ? "Nhập tin nhắn trả lời khách hàng..."
                      : "Hãy chọn một cuộc trò chuyện"
                  }
                  disabled={!cuocTroChuyenDangChon || dangGuiTin}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #444",
                    background: "#080808",
                    color: "#fff",
                  }}
                />

                <button
                  type="submit"
                  disabled={
                    !cuocTroChuyenDangChon ||
                    !noiDungTraLoi.trim() ||
                    dangGuiTin
                  }
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "6px",
                    background: "#e10600",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {dangGuiTin ? "ĐANG GỬI..." : "GỬI"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUẢN LÝ TÀI KHOẢN */}

      {hienQuanLyUser && (
        <div className="admin-users">
          <div className="admin-users-header">
            <div>
              <h2>QUẢN LÝ TÀI KHOẢN</h2>
              <p>
                Tổng số tài khoản: <strong>{danhSachUser.length}</strong>
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={layDanhSachUser}
              disabled={dangTai}
            >
              {dangTai ? "ĐANG TẢI..." : "🔄 LÀM MỚI"}
            </button>
          </div>

          {loiTaiUser && (
            <div className="admin-statistics-error">
              {loiTaiUser}
              <button type="button" onClick={layDanhSachUser}>
                THỬ LẠI
              </button>
            </div>
          )}

          {dangTai ? (
            <div className="admin-loading">Đang tải danh sách tài khoản...</div>
          ) : danhSachUser.length === 0 ? (
            <div className="admin-loading">
              Chưa có tài khoản nào để hiển thị.
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>HỌ TÊN</th>
                    <th>EMAIL</th>
                    <th>QUYỀN</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>

                <tbody>
                  {danhSachUser.map((item, index) => (
                    <tr key={item._id || item.id || item.email || index}>
                      <td>{index + 1}</td>
                      <td>{item.hoTen || "Chưa cập nhật"}</td>
                      <td>{item.email || "Chưa có email"}</td>

                      <td>
                        <span className={`role-badge role-${item.role}`}>
                          {hienThiRole(item.role)}
                        </span>
                      </td>

                      <td>
                        <div className="admin-actions">
                          <select
                            aria-label={`Quyền của ${item.hoTen || item.email}`}
                            value={item.role || "customer"}
                            disabled={
                              String(item._id || item.id) === userId &&
                              item.role === "admin"
                            }
                            onChange={(e) =>
                              doiQuyen(item._id || item.id, e.target.value)
                            }
                          >
                            <option value="customer">Khách hàng</option>
                            <option value="staff">Nhân viên</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            type="button"
                            className="delete-user"
                            disabled={String(item._id || item.id) === userId}
                            onClick={() =>
                              xoaUser(item._id || item.id, item.hoTen)
                            }
                          >
                            XÓA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;

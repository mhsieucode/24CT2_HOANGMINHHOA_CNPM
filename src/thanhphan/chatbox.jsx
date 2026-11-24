import { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import "../App.css";

const SERVER_URL = "http://localhost:5000";
const API = `${SERVER_URL}/api/chat`;

// ======================================
// CHATBOX MH MOTO
// ======================================

function ChatBox() {
  const [moChat, setMoChat] = useState(false);
  const [noiDung, setNoiDung] = useState("");
  const [tinNhans, setTinNhans] = useState([]);
  const [dangGui, setDangGui] = useState(false);
  const [dangKetNoi, setDangKetNoi] = useState(false);
  const [daTaiLichSu, setDaTaiLichSu] = useState(false);
  const [socketOnline, setSocketOnline] = useState(false);

  const khungChatRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const coTinNhanRef = useRef(false);

  // ======================================
  // LẤY THÔNG TIN TÀI KHOẢN
  // ======================================

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = user?._id || user?.id || "";
  const tenKhach = user?.hoTen || "Khách hàng";

  // ======================================
  // MỖI TÀI KHOẢN CÓ MỘT CUỘC TRÒ CHUYỆN RIÊNG
  // ======================================

  const conversationId = useMemo(() => {
    if (!userId) return "";

    const key = `mhMotoChatId_${userId}`;

    let id = localStorage.getItem(key);

    if (!id) {
      id = "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

      localStorage.setItem(key, id);
    }

    return id;
  }, [userId]);

  // ======================================
  // CHUYỂN TIN NHẮN VỀ ĐỊNH DẠNG HIỂN THỊ
  // ======================================

  const chuanHoaTinNhan = (msg) => ({
    _id:
      msg._id ||
      `${msg.sender}_${msg.createdAt || Date.now()}_${Math.random()}`,
    sender: msg.sender === "customer" ? "user" : msg.sender,
    content: msg.content || msg.noiDung || "",
    createdAt: msg.createdAt || new Date().toISOString(),
  });

  // ======================================
  // THÊM TIN NHẮN VÀO DANH SÁCH, TRÁNH TRÙNG
  // ======================================

  const themTinNhan = (msg) => {
    if (!msg) return;

    const tinNhan = chuanHoaTinNhan(msg);

    setTinNhans((prev) => {
      const daTonTai = prev.some(
        (item) => String(item._id) === String(tinNhan._id)
      );

      if (daTonTai) return prev;

      return [...prev, tinNhan].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  };

  // ======================================
  // KIỂM TRA KẾT NỐI BACKEND
  // ======================================

  useEffect(() => {
    let dangHoatDong = true;

    const kiemTraServer = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/health`);

        if (!response.ok) {
          throw new Error("Server chưa sẵn sàng");
        }

        if (dangHoatDong) {
          setDangKetNoi(true);
        }
      } catch (error) {
        if (dangHoatDong) {
          setDangKetNoi(false);
        }

        console.error("Lỗi kết nối MH MOTO:", error);
      }
    };

    kiemTraServer();

    const interval = setInterval(kiemTraServer, 10000);

    return () => {
      dangHoatDong = false;
      clearInterval(interval);
    };
  }, []);

  // ======================================
  // TẢI LỊCH SỬ TRÒ CHUYỆN
  // ======================================

  useEffect(() => {
    let huy = false;

    const taiLichSu = async () => {
      setDaTaiLichSu(false);
      setTinNhans([]);
      coTinNhanRef.current = false;

      if (!userId || !conversationId) {
        setDaTaiLichSu(true);
        return;
      }

      try {
        const response = await fetch(
          `${API}/history/${encodeURIComponent(conversationId)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Không tải được lịch sử trò chuyện");
        }

        if (!huy && Array.isArray(data)) {
          const danhSach = data.map(chuanHoaTinNhan);

          setTinNhans(danhSach);
          coTinNhanRef.current = danhSach.length > 0;

          // Nếu Socket đã kết nối thì tham gia phòng chat
          if (danhSach.length > 0 && socketRef.current?.connected) {
            socketRef.current.emit("chat:join", conversationId);
          }
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      } finally {
        if (!huy) {
          setDaTaiLichSu(true);
        }
      }
    };

    taiLichSu();

    return () => {
      huy = true;
    };
  }, [userId, conversationId]);

  // ======================================
  // KẾT NỐI SOCKET.IO
  // ======================================

  useEffect(() => {
    if (!userId || !conversationId) {
      setSocketOnline(false);
      return;
    }

    const socket = io(SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // SOCKET KẾT NỐI THÀNH CÔNG
    socket.on("connect", () => {
      console.log("MH MOTO CHAT SOCKET ĐÃ KẾT NỐI:", socket.id);

      setSocketOnline(true);

      // Chỉ tham gia phòng khi đã có tin nhắn thuộc tài khoản
      if (coTinNhanRef.current) {
        socket.emit("chat:join", conversationId);
      }
    });

    // SOCKET MẤT KẾT NỐI
    socket.on("disconnect", (reason) => {
      console.log("MH MOTO CHAT SOCKET NGẮT KẾT NỐI:", reason);

      setSocketOnline(false);
    });

    // SOCKET BÁO LỖI
    socket.on("connect_error", (error) => {
      console.error("LỖI SOCKET CHAT:", error.message);

      setSocketOnline(false);
    });

    // NHẬN TIN NHẮN TỪ ADMIN HOẶC CHATBOT
    socket.on("chat:receive", (msg) => {
      if (!msg) return;

      const maCuocTroChuyen = String(msg?.conversationId || "");
      const maDangMo = String(conversationId || "");

      if (!maCuocTroChuyen || maCuocTroChuyen !== maDangMo) {
        console.log("Tin nhắn không thuộc cuộc trò chuyện đang mở:", {
          maCuocTroChuyen,
          maDangMo,
        });
        return;
      }

      themTinNhan(msg);

      themTinNhan(msg);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("chat:receive");

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setSocketOnline(false);
    };
  }, [userId, conversationId]);

  // ======================================
  // TỰ ĐỘNG CUỘN XUỐNG CUỐI
  // ======================================

  useEffect(() => {
    if (khungChatRef.current) {
      khungChatRef.current.scrollTop = khungChatRef.current.scrollHeight;
    }
  }, [tinNhans, moChat]);

  // ======================================
  // GỬI TIN NHẮN
  // ======================================

  const guiTinNhan = async () => {
    const text = noiDung.trim();

    if (!text || dangGui) return;

    if (!userId || !conversationId) {
      alert("Bạn vui lòng đăng nhập để sử dụng chức năng chat MH MOTO!");
      return;
    }

    if (!dangKetNoi) {
      alert("Máy chủ MH MOTO chưa kết nối. Bạn vui lòng thử lại!");
      return;
    }

    setDangGui(true);
    setNoiDung("");

    try {
      const response = await fetch(`${API}/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không gửi được tin nhắn!");
      }

      // THÊM TIN NHẮN KHÁCH HÀNG
      if (data.userMessage) {
        themTinNhan(data.userMessage);
      }

      // THÊM TIN NHẮN CHATBOT
      if (data.botMessage) {
        themTinNhan(data.botMessage);
      }

      // ĐÁNH DẤU CUỘC TRÒ CHUYỆN ĐÃ CÓ TIN NHẮN
      coTinNhanRef.current = true;

      // THAM GIA PHÒNG SOCKET ĐỂ NHẬN TIN NHẮN ADMIN
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", conversationId);
      }
    } catch (error) {
      console.error("LỖI GỬI CHAT:", error);

      setNoiDung(text);

      alert(error.message || "Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setDangGui(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // ======================================
  // ĐỊNH DẠNG THỜI GIAN
  // ======================================

  const dinhDangGio = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ======================================
  // CHỌN CÂU HỎI GỢI Ý
  // ======================================

  const chonGoiY = (text) => {
    setNoiDung(text);
    inputRef.current?.focus();
  };

  // ======================================
  // GIAO DIỆN CHAT
  // ======================================

  return (
    <div className="mh-chat-container">
      {/* NÚT MỞ CHAT */}

      {!moChat && (
        <button
          className="mh-chat-button"
          onClick={() => setMoChat(true)}
          aria-label="Mở chat MH MOTO"
        >
          <span className="mh-chat-icon">💬</span>
          <span className="mh-chat-badge"></span>
        </button>
      )}

      {/* KHUNG CHAT */}

      {moChat && (
        <div className="mh-chat-window">
          {/* HEADER */}

          <div className="mh-chat-header">
            <div className="mh-chat-logo">
              MH<span>MOTO</span>
            </div>

            <div className="mh-chat-header-info">
              <strong>MH MOTO SUPPORT</strong>

              <small>
                <span
                  className={
                    dangKetNoi && socketOnline ? "mh-online" : "mh-offline"
                  }
                ></span>

                {!dangKetNoi
                  ? "Đang kết nối máy chủ..."
                  : socketOnline
                  ? "Đang trực tuyến"
                  : "Đang kết nối Live Chat..."}
              </small>
            </div>

            <button
              className="mh-chat-close"
              onClick={() => setMoChat(false)}
              aria-label="Đóng chat"
            >
              ✕
            </button>
          </div>

          {/* NỘI DUNG CHAT */}

          <div className="mh-chat-messages" ref={khungChatRef}>
            <div className="mh-chat-welcome">
              <div className="mh-bot-avatar">🏍️</div>

              <strong>Xin chào {tenKhach}!</strong>

              <p>
                Chào mừng bạn đến với MH MOTO. Mình có thể giúp gì cho bạn hôm
                nay?
              </p>

              <small>Trợ lý tư vấn tự động MH MOTO</small>
            </div>

            {!userId && (
              <div className="mh-chat-loading">
                Vui lòng đăng nhập để bắt đầu trò chuyện.
              </div>
            )}

            {!daTaiLichSu && userId && (
              <div className="mh-chat-loading">Đang tải cuộc trò chuyện...</div>
            )}

            {tinNhans.map((msg) => {
              const laKhach =
                msg.sender === "user" || msg.sender === "customer";

              const laAdmin = msg.sender === "admin";

              return (
                <div
                  key={msg._id}
                  className={
                    laKhach
                      ? "mh-message mh-message-customer"
                      : "mh-message mh-message-bot"
                  }
                >
                  {!laKhach && (
                    <div className="mh-message-avatar">
                      {laAdmin ? "👨‍💼" : "🏍️"}
                    </div>
                  )}

                  <div className="mh-message-content">
                    <div className="mh-message-name">
                      {laKhach
                        ? "Bạn"
                        : laAdmin
                        ? "NHÂN VIÊN MH MOTO"
                        : "MH MOTO BOT"}
                    </div>

                    <div className="mh-message-text">{msg.content}</div>

                    <span className="mh-message-time">
                      {dinhDangGio(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}

            {dangGui && (
              <div className="mh-message mh-message-bot">
                <div className="mh-message-avatar">🏍️</div>

                <div className="mh-message-content">
                  <div className="mh-message-name">MH MOTO BOT</div>

                  <div className="mh-message-text">
                    Đang soạn câu trả lời...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GỢI Ý CÂU HỎI */}

          <div className="mh-chat-suggestions">
            {[
              "Giới thiệu cửa hàng",
              "Xe mô tô",
              "Mũ bảo hiểm",
              "Cách đặt hàng",
            ].map((item) => (
              <button
                key={item}
                onClick={() => chonGoiY(item)}
                disabled={dangGui}
              >
                {item}
              </button>
            ))}
          </div>

          {/* NHẬP TIN NHẮN */}

          <div className="mh-chat-input-area">
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập tin nhắn của bạn..."
              value={noiDung}
              maxLength={2000}
              disabled={dangGui || !userId}
              onChange={(e) => setNoiDung(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  guiTinNhan();
                }
              }}
            />

            <button
              className="mh-chat-send"
              onClick={guiTinNhan}
              disabled={!noiDung.trim() || dangGui || !dangKetNoi || !userId}
              aria-label="Gửi tin nhắn"
            >
              ➤
            </button>
          </div>

          <div className="mh-chat-footer">POWERED BY MH MOTO</div>
        </div>
      )}
    </div>
  );
}

export default ChatBox;

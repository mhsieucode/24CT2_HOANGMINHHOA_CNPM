import { useState, useEffect, useRef } from "react";
import "../App.css";

const SERVER_URL = "http://localhost:5000";
const API = `${SERVER_URL}/api/chat`;

function ChatBox() {
  const [moChat, setMoChat] = useState(false);
  const [noiDung, setNoiDung] = useState("");
  const [tinNhans, setTinNhans] = useState([]);
  const [dangGui, setDangGui] = useState(false);
  const [dangKetNoi, setDangKetNoi] = useState(false);
  const [daTaiLichSu, setDaTaiLichSu] = useState(false);

  const khungChatRef = useRef(null);
  const inputRef = useRef(null);

  // ======================================
  // TẠO MÃ CUỘC TRÒ CHUYỆN RIÊNG
  // ======================================

  const [conversationId] = useState(() => {
    let id = localStorage.getItem("mhMotoChatId");

    if (!id) {
      id = "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

      localStorage.setItem("mhMotoChatId", id);
    }

    return id;
  });

  // ======================================
  // LẤY TÊN KHÁCH HÀNG
  // ======================================

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const tenKhach = user?.hoTen || "Khách hàng";

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
  // CHUYỂN DỮ LIỆU TIN NHẮN VỀ ĐỊNH DẠNG HIỂN THỊ
  // ======================================

  const chuanHoaTinNhan = (msg) => ({
    _id:
      msg._id ||
      `${msg.sender}_${msg.createdAt || Date.now()}_${Math.random()}`,
    sender:
      msg.sender === "user" || msg.sender === "customer" ? "user" : msg.sender,
    content: msg.content || msg.noiDung || "",
    createdAt: msg.createdAt || new Date().toISOString(),
  });

  // ======================================
  // TẢI LỊCH SỬ TRÒ CHUYỆN
  // ======================================

  useEffect(() => {
    let huy = false;

    const taiLichSu = async () => {
      try {
        const response = await fetch(
          `${API}/history/${encodeURIComponent(conversationId)}`
        );

        if (!response.ok) {
          throw new Error("Không tải được lịch sử trò chuyện");
        }

        const data = await response.json();

        if (!huy && Array.isArray(data)) {
          setTinNhans(data.map(chuanHoaTinNhan));
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
  }, [conversationId]);

  // ======================================
  // TỰ ĐỘNG CUỘN XUỐNG CUỐI
  // ======================================

  useEffect(() => {
    if (khungChatRef.current) {
      khungChatRef.current.scrollTop = khungChatRef.current.scrollHeight;
    }
  }, [tinNhans, moChat]);

  // ======================================
  // GỬI TIN NHẮN VÀ NHẬN BOT TRẢ LỜI
  // ======================================

  const guiTinNhan = async () => {
    const text = noiDung.trim();

    if (!text || dangGui) return;

    if (!dangKetNoi) {
      alert("Máy chủ MH MOTO chưa kết nối. Bạn vui lòng thử lại!");
      return;
    }

    setDangGui(true);
    setNoiDung("");

    try {
      const response = await fetch(`${API}/send`, {
        method: "POST",
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

      // Thêm tin nhắn khách hàng
      const tinKhach = chuanHoaTinNhan(data.userMessage);

      // Thêm câu trả lời của chatbot
      const tinBot = chuanHoaTinNhan(data.botMessage);

      setTinNhans((prev) => {
        const ids = new Set(prev.map((item) => item._id));

        const ketQua = [...prev];

        if (!ids.has(tinKhach._id)) {
          ketQua.push(tinKhach);
        }

        if (!ids.has(tinBot._id)) {
          ketQua.push(tinBot);
        }

        return ketQua;
      });
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
                  className={dangKetNoi ? "mh-online" : "mh-offline"}
                ></span>

                {dangKetNoi ? "Trợ lý đang trực tuyến" : "Đang kết nối..."}
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

            {!daTaiLichSu && (
              <div className="mh-chat-loading">Đang tải cuộc trò chuyện...</div>
            )}

            {tinNhans.map((msg) => {
              const laKhach =
                msg.sender === "user" || msg.sender === "customer";

              return (
                <div
                  key={msg._id}
                  className={
                    laKhach
                      ? "mh-message mh-message-customer"
                      : "mh-message mh-message-bot"
                  }
                >
                  {!laKhach && <div className="mh-message-avatar">🏍️</div>}

                  <div className="mh-message-content">
                    <div className="mh-message-name">
                      {laKhach ? "Bạn" : "MH MOTO BOT"}
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
              disabled={dangGui}
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
              disabled={!noiDung.trim() || dangGui || !dangKetNoi}
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

const express = require("express");
const router = express.Router();

const Message = require("../models/massage");
const Product = require("../models/product");

// ======================================
// 1. CHUẨN HÓA NỘI DUNG
// ======================================

const chuanHoa = (noiDung) => {
  return String(noiDung || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim()
    .replace(/\s+/g, " ");
};

// ======================================
// 2. ĐỊNH DẠNG GIÁ
// ======================================

const dinhDangGia = (gia) => {
  return Number(gia || 0).toLocaleString("vi-VN") + "đ";
};

// ======================================
// 3. TÌM SẢN PHẨM THEO TÊN
// ======================================

const timSanPham = async (tuKhoa) => {
  const tuKhoaChuan = chuanHoa(tuKhoa);

  if (!tuKhoaChuan) return [];

  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return products.filter((product) => {
    const ten = chuanHoa(product.tenSanPham);

    return ten.includes(tuKhoaChuan) || tuKhoaChuan.includes(ten);
  });
};

// ======================================
// 4. LẤY SẢN PHẨM THEO DANH MỤC
// ======================================

const laySanPhamTheoDanhMuc = async (loai) => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return products.filter((product) => {
    const danhMuc = chuanHoa(product.danhMuc);

    if (loai === "xe") {
      return (
        danhMuc.includes("xe moto") ||
        danhMuc.includes("xe mo to") ||
        danhMuc === "moto" ||
        danhMuc.includes("motor")
      );
    }

    if (loai === "mu") {
      return (
        danhMuc.includes("mu") ||
        danhMuc.includes("non") ||
        danhMuc.includes("bao hiem")
      );
    }

    if (loai === "phutung") {
      return danhMuc.includes("phu tung") || danhMuc.includes("linh kien");
    }

    if (loai === "banhxe") {
      return danhMuc.includes("banh xe") || danhMuc.includes("lop xe");
    }

    return false;
  });
};

// ======================================
// 5. HIỂN THỊ DANH SÁCH SẢN PHẨM
// ======================================

const taoDanhSachSanPham = (products, loai) => {
  if (!products.length) {
    return `Hiện tại MH MOTO chưa tìm thấy sản phẩm ${loai} trong kho. Bạn vui lòng quay lại sau nhé!`;
  }

  return products
    .slice(0, 5)
    .map((p, i) => {
      return (
        `${i + 1}. ${p.tenSanPham}\n` +
        `💰 Giá: ${dinhDangGia(p.gia)}\n` +
        `📦 Số lượng: ${Number(p.soLuong || 0)} sản phẩm`
      );
    })
    .join("\n\n");
};

// ======================================
// 6. CHATBOT TRẢ LỜI TỰ ĐỘNG
// ======================================

async function traLoiChatBot(noiDung) {
  try {
    const text = chuanHoa(noiDung);

    if (!text) {
      return "Bạn vui lòng nhập nội dung cần tư vấn nhé!";
    }

    // CHÀO HỎI
    if (/^(xin chao|chao shop|hello|hi|shop oi|alo)\b/.test(text)) {
      return (
        "Xin chào! 🏍️ Chào mừng bạn đến với MH MOTO!\n\n" +
        "Mình là trợ lý tư vấn tự động. Mình có thể giúp bạn tìm hiểu:\n\n" +
        "🏍️ Xe mô tô\n" +
        "🪖 Mũ bảo hiểm\n" +
        "🔧 Phụ tùng xe\n" +
        "🛞 Bánh xe\n" +
        "💰 Giá và số lượng sản phẩm\n" +
        "🛒 Hướng dẫn đặt hàng\n\n" +
        "Bạn muốn tìm hiểu sản phẩm nào ạ?"
      );
    }

    // GIỚI THIỆU CỬA HÀNG
    if (/gioi thieu|cua hang|mh moto|shop o dau|ban nhung gi/.test(text)) {
      return (
        "🏍️ CHÀO MỪNG BẠN ĐẾN VỚI MH MOTO!\n\n" +
        "MH MOTO là cửa hàng kinh doanh các sản phẩm dành cho người yêu xe mô tô.\n\n" +
        "Các danh mục sản phẩm:\n" +
        "🏍️ Xe mô tô\n" +
        "🪖 Mũ bảo hiểm\n" +
        "🔧 Phụ tùng xe\n" +
        "🛞 Bánh xe\n" +
        "🛠️ Phụ kiện xe\n\n" +
        "Bạn cần mình tư vấn danh mục nào ạ?"
      );
    }

    // HƯỚNG DẪN ĐẶT HÀNG
    if (/dat hang|mua hang|thanh toan|gio hang|cach mua/.test(text)) {
      return (
        "🛒 HƯỚNG DẪN ĐẶT HÀNG TẠI MH MOTO:\n\n" +
        "1. Chọn sản phẩm bạn yêu thích.\n" +
        "2. Nhấn vào Chi tiết sản phẩm.\n" +
        "3. Chọn số lượng và nhấn Thêm vào giỏ.\n" +
        "4. Mở giỏ hàng để kiểm tra sản phẩm.\n" +
        "5. Điền họ tên, số điện thoại và địa chỉ nhận hàng.\n" +
        "6. Chọn phương thức thanh toán.\n" +
        "7. Xác nhận đặt hàng.\n\n" +
        "Cảm ơn bạn đã mua sắm tại MH MOTO! ❤️"
      );
    }

    // VẬN CHUYỂN
    if (/ship|giao hang|van chuyen|bao lau nhan|phi ship/.test(text)) {
      return (
        "🚚 VỀ VẬN CHUYỂN TẠI MH MOTO:\n\n" +
        "Đơn hàng sẽ được tiếp nhận và xử lý sau khi đặt hàng thành công.\n\n" +
        "Thời gian giao hàng và phí vận chuyển phụ thuộc vào địa chỉ nhận hàng và đơn vị vận chuyển.\n\n" +
        "Bạn vui lòng liên hệ nhân viên MH MOTO nếu cần hỗ trợ chi tiết nhé!"
      );
    }

    // BẢO HÀNH
    if (/bao hanh|doi tra|doi hang|bao hanh bao lau/.test(text)) {
      return (
        "🛡️ CHÍNH SÁCH BẢO HÀNH:\n\n" +
        "Thông tin bảo hành và đổi trả có thể khác nhau tùy từng sản phẩm.\n\n" +
        "Bạn vui lòng kiểm tra thông tin sản phẩm hoặc liên hệ nhân viên MH MOTO để được tư vấn chính xác nhé!"
      );
    }

    // CẢM ƠN
    if (/cam on|thank|thanks/.test(text)) {
      return "MH MOTO rất vui được hỗ trợ bạn! ❤️ Chúc bạn một ngày tốt lành!";
    }

    // HỎI GIÁ / TỒN KHO / SỐ LƯỢNG
    const canTimSanPham =
      /gia|bao nhieu|ton kho|con hang|het hang|con khong|so luong/.test(text);

    if (canTimSanPham) {
      const tuKhoa = text
        .replace(
          /\b(gia|bao nhieu tien|bao nhieu|ton kho|con hang|het hang|con khong|so luong|cho hoi|shop oi|san pham|la|cua|bao nhieu vay)\b/g,
          ""
        )
        .replace(/[?!.,]/g, "")
        .trim();

      if (tuKhoa.length >= 2) {
        const products = await timSanPham(tuKhoa);

        if (products.length > 0) {
          return (
            "🔎 THÔNG TIN SẢN PHẨM MH MOTO:\n\n" +
            products
              .slice(0, 5)
              .map((p) => {
                const soLuong = Number(p.soLuong || 0);

                return (
                  `🏍️ ${p.tenSanPham}\n` +
                  `💰 Giá: ${dinhDangGia(p.gia)}\n` +
                  `📦 Số lượng: ${soLuong} sản phẩm\n` +
                  `📌 Tình trạng: ${soLuong > 0 ? "Còn hàng" : "Hết hàng"}`
                );
              })
              .join("\n\n")
          );
        }

        return (
          `Mình chưa tìm thấy sản phẩm "${tuKhoa}" trong kho MH MOTO. 😥\n\n` +
          "Bạn vui lòng kiểm tra lại tên sản phẩm nhé!"
        );
      }

      return (
        "💰 Bạn muốn hỏi giá hoặc số lượng của sản phẩm nào ạ?\n\n" +
        "Ví dụ:\n" +
        "• Yamaha R1 giá bao nhiêu?\n" +
        "• Ducati Panigale còn hàng không?\n" +
        "• Giá mũ bảo hiểm fullface?"
      );
    }

    // XE MÔ TÔ
    if (/xe moto|xe mo to|moto|phan khoi|motor|xe may/.test(text)) {
      const products = await laySanPhamTheoDanhMuc("xe");

      return (
        "🏍️ CÁC MẪU XE MÔ TÔ TẠI MH MOTO:\n\n" +
        taoDanhSachSanPham(products, "xe mô tô") +
        "\n\nBạn muốn tìm hiểu mẫu xe nào ạ?"
      );
    }

    // MŨ BẢO HIỂM
    if (/mu bao hiem|non bao hiem|fullface|full face|mu|non/.test(text)) {
      const products = await laySanPhamTheoDanhMuc("mu");

      return (
        "🪖 CÁC MẪU MŨ BẢO HIỂM TẠI MH MOTO:\n\n" +
        taoDanhSachSanPham(products, "mũ bảo hiểm") +
        "\n\nBạn muốn tìm hiểu loại mũ nào ạ?"
      );
    }

    // PHỤ TÙNG
    if (/phu tung|linh kien/.test(text)) {
      const products = await laySanPhamTheoDanhMuc("phutung");

      return (
        "🔧 PHỤ TÙNG XE TẠI MH MOTO:\n\n" +
        taoDanhSachSanPham(products, "phụ tùng") +
        "\n\nBạn muốn tìm loại phụ tùng nào ạ?"
      );
    }

    // BÁNH XE
    if (/banh xe|lop xe/.test(text)) {
      const products = await laySanPhamTheoDanhMuc("banhxe");

      return (
        "🛞 SẢN PHẨM BÁNH XE TẠI MH MOTO:\n\n" +
        taoDanhSachSanPham(products, "bánh xe") +
        "\n\nBạn muốn tìm hiểu sản phẩm nào ạ?"
      );
    }

    // HỎI NHÂN VIÊN
    if (/nhan vien|tu van vien|nguoi that|gap nguoi/.test(text)) {
      return (
        "👨‍💼 MH MOTO đã ghi nhận yêu cầu của bạn.\n\n" +
        "Bạn vui lòng để lại nội dung cần hỗ trợ. Nhân viên sẽ tiếp nhận và hỗ trợ bạn khi có thể nhé!"
      );
    }

    // CÂU HỎI CHƯA NHẬN DIỆN
    return (
      "Xin lỗi, mình chưa hiểu rõ câu hỏi của bạn. 😅\n\n" +
      "Mình có thể hỗ trợ các nội dung sau:\n\n" +
      "🏍️ Xe mô tô\n" +
      "🪖 Mũ bảo hiểm\n" +
      "🔧 Phụ tùng xe\n" +
      "🛞 Bánh xe\n" +
      "💰 Giá sản phẩm\n" +
      "📦 Số lượng tồn kho\n" +
      "🛒 Cách đặt hàng\n" +
      "🚚 Vận chuyển và giao hàng\n\n" +
      "Bạn thử nhập câu hỏi khác nhé!"
    );
  } catch (error) {
    console.error("LỖI CHATBOT:", error);

    return "Xin lỗi, hệ thống tư vấn MH MOTO đang gặp sự cố. Bạn vui lòng thử lại sau nhé!";
  }
}

// ======================================
// 7. LẤY LỊCH SỬ CHAT
// ======================================

router.get("/history/:conversationId", async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || "").trim();

    if (!conversationId || conversationId.length > 100) {
      return res.status(400).json({
        message: "Mã cuộc trò chuyện không hợp lệ!",
      });
    }

    const messages = await Message.find({
      conversationId,
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("LỖI LẤY LỊCH SỬ CHAT:", error);

    return res.status(500).json({
      message: "Không thể tải lịch sử trò chuyện!",
    });
  }
});

// ======================================
// 8. GỬI TIN NHẮN VÀ NHẬN TRẢ LỜI TỰ ĐỘNG
// ======================================

router.post("/send", async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!conversationId || !content || !String(content).trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập nội dung tin nhắn!",
      });
    }

    if (String(content).length > 2000) {
      return res.status(400).json({
        message: "Tin nhắn không được vượt quá 2000 ký tự!",
      });
    }

    const id = String(conversationId).trim();
    const noiDung = String(content).trim();

    if (id.length > 100) {
      return res.status(400).json({
        message: "Mã cuộc trò chuyện không hợp lệ!",
      });
    }

    // LƯU TIN NHẮN KHÁCH HÀNG
    const userMessage = await Message.create({
      conversationId: id,
      sender: "user",
      content: noiDung,
    });

    // CHATBOT TỰ ĐỘNG XỬ LÝ
    const reply = await traLoiChatBot(noiDung);

    // LƯU CÂU TRẢ LỜI CHATBOT
    const botMessage = await Message.create({
      conversationId: id,
      sender: "bot",
      content: reply,
    });

    return res.status(200).json({
      message: "Gửi tin nhắn thành công!",
      userMessage,
      botMessage,
      reply,
    });
  } catch (error) {
    console.error("LỖI GỬI TIN NHẮN:", error);

    return res.status(500).json({
      message: "Không thể gửi tin nhắn!",
    });
  }
});

// ======================================
// 9. XUẤT HÀM CHATBOT CHO SOCKET.IO
// ======================================

router.traLoiChatBot = traLoiChatBot;

module.exports = router;

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // ID cuộc trò chuyện
    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    // Tài khoản sở hữu cuộc trò chuyện
    // Không bắt buộc để tương thích tin nhắn cũ
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Người gửi tin nhắn
    sender: {
      type: String,
      enum: ["user", "bot", "admin"],
      required: true,
    },

    // Nội dung tin nhắn
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tăng tốc truy vấn lịch sử trò chuyện
messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

messageSchema.index({
  ownerId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Message", messageSchema);

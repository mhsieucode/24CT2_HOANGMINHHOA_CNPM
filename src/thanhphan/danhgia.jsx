import { useState } from "react";

function DanhGia() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const [reviews, setReviews] = useState([
    {
      name: "Nguyễn Văn An",
      rating: 5,
      content:
        "Sản phẩm đẹp, chất lượng tốt. Shop tư vấn rất nhiệt tình.",
    },
    {
      name: "Trần Minh Tuấn",
      rating: 5,
      content:
        "Giao hàng nhanh, sản phẩm đúng mô tả. Rất hài lòng.",
    },
  ]);

  // GỬI ĐÁNH GIÁ
  const handleSubmit = (e) => {
    e.preventDefault();

    if (name.trim() === "" || content.trim() === "") {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const newReview = {
      name: name,
      rating: rating,
      content: content,
    };

    setReviews([newReview, ...reviews]);

    // Xóa form sau khi gửi
    setName("");
    setRating(5);
    setContent("");

    alert("Cảm ơn bạn đã đánh giá MOTO SHOP!");
  };

  return (
    <section className="reviews" id="danhgia">

      {/* TIÊU ĐỀ */}
      <div className="reviews-title">
        <span>💬</span>
        <h2>ĐÁNH GIÁ KHÁCH HÀNG</h2>
        <span>⭐</span>
      </div>


      {/* FORM ĐÁNH GIÁ */}
      <div className="review-form">

        <h3>HÃY ĐỂ LẠI ĐÁNH GIÁ CỦA BẠN</h3>

        <form onSubmit={handleSubmit}>

          {/* TÊN */}
          <input
            type="text"
            placeholder="Nhập tên của bạn..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />


          {/* CHỌN SAO */}
          <div className="choose-rating">

            <p>Đánh giá của bạn:</p>

            <div className="star-select">

              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= rating ? "active-star" : ""}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}

            </div>

          </div>


          {/* NỘI DUNG */}
          <textarea
            placeholder="Nhập nội dung đánh giá..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
          ></textarea>


          {/* GỬI */}
          <button type="submit">
            GỬI ĐÁNH GIÁ
          </button>

        </form>

      </div>


      {/* DANH SÁCH ĐÁNH GIÁ */}
      <div className="review-list">

        <h3>ĐÁNH GIÁ MỚI NHẤT</h3>

        {reviews.map((review, index) => (
          <div className="review-item" key={index}>

            <div className="review-avatar">
              {review.name.charAt(0).toUpperCase()}
            </div>

            <div className="review-detail">

              <h4>{review.name}</h4>

              <div className="review-stars">
                {"★".repeat(review.rating)}
                <span className="empty-stars">
                  {"★".repeat(5 - review.rating)}
                </span>
              </div>

              <p>{review.content}</p>

              <small>✓ Khách hàng đánh giá</small>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default DanhGia;
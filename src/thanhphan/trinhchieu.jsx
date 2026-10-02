import { useState, useEffect } from "react";

function TrinhChieu() {
  const [slide, setSlide] = useState(0);

  const banners = [
    "/image/poster1.jpg",
    "/image/poster2.jpg",
    "/image/poster3.jpg",
  ];

  // Tự động chuyển slide
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prevSlide) => (prevSlide + 1) % banners.length);
    }, 750); // 3000 = 3 giây

    return () => clearInterval(timer);
  }, [banners.length]);

  // Nút Next
  const nextSlide = () => {
    setSlide((prevSlide) => (prevSlide + 1) % banners.length);
  };

  // Nút Previous
  const prevSlide = () => {
    setSlide((prevSlide) => (prevSlide - 1 + banners.length) % banners.length);
  };

  return (
    <section className="slider">
      <img src={banners[slide]} alt="Banner phụ kiện mô tô" />

      <button className="prev" onClick={prevSlide}>
        ❮
      </button>

      <button className="next" onClick={nextSlide}>
        ❯
      </button>

      <div className="dots">
        {banners.map((_, index) => (
          <span
            key={index}
            className={slide === index ? "dot active" : "dot"}
            onClick={() => setSlide(index)}
          ></span>
        ))}
      </div>
    </section>
  );
}

export default TrinhChieu;

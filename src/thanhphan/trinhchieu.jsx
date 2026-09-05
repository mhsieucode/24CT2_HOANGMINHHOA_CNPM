import { useState } from "react";

function TrinhChieu() {
  const [slide, setSlide] = useState(0);

  const banners = [
    "/image/poster1.jpg",
    "/image/poster2.jpg",
    "/image/poster3.jpg",
  ];

  const nextSlide = () => {
    setSlide((slide + 1) % banners.length);
  };

  const prevSlide = () => {
    setSlide((slide - 1 + banners.length) % banners.length);
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

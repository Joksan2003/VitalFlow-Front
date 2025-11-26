import { useEffect, useState, useRef } from "react";
import "../styles/Carrousel.css";
import img1 from "../assets/Img_Login_1.jpg";
import img2 from "../assets/Img_Login_2.jpg";
import img3 from "../assets/Img_Login_3.jpg";

const slides = [
  { id: 1, img: img1, title: "Bienvenido a VitalFlow", subtitle: "Pequeños hábitos, gran impacto" },
  { id: 2, img: img2, title: "Entrena con propósito", subtitle: "Rutinas reales para tu vida" },
  { id: 3, img: img3, title: "Come local y balanceado", subtitle: "Recetas adaptadas a tu cultura" },
];

export default function Carousel() {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // inicia autoplay al montar
    start();
    // limpia al desmontar
    return () => stop();
    // eslint-disable-next-line
  }, []);

  const start = () => {
    stop();
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 4000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const go = (n) => {
    setIdx(n);
    // reinicia autoplay rápido para dar feedback al usuario
    start();
  };

  return (
    <div className="vf-carousel">
      <div
        className="vf-carousel__track"
        style={{ transform: `translateX(-${idx * 100}%)` }}
        aria-live="polite"
      >
        {slides.map((s) => (
          <figure key={s.id} className="vf-slide" role="group" aria-roledescription="slide" aria-label={s.title}>
            <img
              src={s.img}
              alt={s.title}
              loading={s.id === 1 ? "eager" : "lazy"}
              decoding="async"
              draggable="false"
              sizes="(max-width: 900px) 100vw, 80vw"
            />

            {/* overlay central grande */}
            <figcaption className="vf-slide__caption">
              <h1 className="vf-slide__title">{s.title}</h1>
              <p className="vf-slide__subtitle">{s.subtitle}</p>
              {/* si quieres un CTA: <button className="vf-cta">Comenzar</button> */}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="vf-carousel__dots" role="tablist" aria-label="Selector de slides">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === idx ? "active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir al slide ${i + 1}`}
            aria-pressed={i === idx}
          />
        ))}
      </div>
    </div>
  );
}

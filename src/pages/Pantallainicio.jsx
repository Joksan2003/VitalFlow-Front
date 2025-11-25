// src/pages/PantallaInicio.jsx
import { useEffect, useRef, useState } from "react";
import "../styles/Pantallainicio.css"; // si tu archivo se llama Pantallainicio.css ajusta el import

import img1 from "../assets/Img_Inicio_1.jpg";
import img2 from "../assets/Img_Inicio_2.jpg";
import img3 from "../assets/Img_Inicio_3.jpg";

const slides = [
  { id: 1, img: img1, text: "“Un nuevo día, una nueva oportunidad para cuidar de ti.”" },
  { id: 2, img: img2, text: "“El bienestar comienza con pequeños pasos.”" },
  { id: 3, img: img3, text: "“Cuida tu cuerpo, es el único lugar donde tienes que vivir.”" }
];

export default function PantallaInicio() {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    startAuto();
    return stopAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const startAuto = () => {
    stopAuto();
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000); // 5 segundos
  };

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goTo = (i) => {
    setIndex(i);
    startAuto();
  };

  return (
    <main className="inicio-container">
      {/* Carrusel motivacional */}
      <section
        className="carousel"
        ref={containerRef}
        onMouseEnter={stopAuto}
        onMouseLeave={startAuto}
        aria-roledescription="carousel"
      >
        {slides.map((s, i) => (
          <div key={s.id} className={`carousel-slide ${i === index ? "active" : ""}`}>
            <img src={s.img} alt={`Slide ${i + 1}`} />
            <div className="carousel-text">
              <h1>{s.text}</h1>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="carousel-dots" role="tablist" aria-label="Navegación del carrusel">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Ir a slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      </section>

      {/* Frases inspiradoras */}
      <section className="frases-section">
        <h2>Encuentra tu motivación 🌿</h2>
        <div className="frases-grid">
          <div className="frase-card">🌱 “El bienestar no es una meta, es un camino.”</div>
          <div className="frase-card">💧 “Cada vaso de agua es un paso hacia una mente clara.”</div>
          <div className="frase-card">🔥 “Pequeños hábitos crean grandes resultados.”</div>
        </div>
      </section>


      {/* Footer */}
      <footer className="inicio-footer">
        <div className="footer-content">
          <p><strong>VitalFlow</strong> © 2025 | Cuidando tu bienestar cada día.</p>
          <p>Desarrollado con 💚 para inspirar hábitos saludables y una vida equilibrada.</p>
        </div>
      </footer>
    </main>
  );
}
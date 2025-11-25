import Carousel from "../components/Carrusel";
import Functionalities from "../components/Functionalities";
import Impact from "../components/Impact";
import "../styles/home.css";

export default function Home() {
  return (
    <main>
      <section id="home" className="section">
        <Carousel />
      </section>

      <section id="func" className="section">
        <Functionalities />
      </section>

      <section id="impact" className="section">
        <Impact />
      </section>
    </main>
  );
}
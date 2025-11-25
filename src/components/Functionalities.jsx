import "../styles/Functionalities.css";
import img1 from "../assets/Chef.png";
import img2 from "../assets/recetas.png";
import img3 from "../assets/ejercicio.png";
import img4 from "../assets/retos.png";
import img5 from "../assets/progreso.png";
import img6 from "../assets/ingredientes.png";


function Functionalities() {
  return (
    <section className="functionalities-section">
      <div className="titulo">
        <h1>Todo lo que necesitas para una vida más saludable</h1>
        <p>
          VitalFlow combina nutrición personalizada, ejercicio y comunidad para
          ayudarte a crear hábitos duraderos.
        </p>
      </div>



      <div className="cards-container">
        <div className="card">
          <div className="icon-container green">
            <img src={img1}/>
          </div>
          <h2>Recetas Personalizadas</h2>
          <p>
            Descubre recetas adaptadas a tus gustos, restricciones y objetivos
            nutricionales.
          </p>
        </div>



        <div className="card">
          <div className="icon-container blue">
            <img src={img2}/>
          </div>
          <h2>Planes Alimenticios</h2>
          <p>
            Genera planes semanales basados en tus necesidades calóricas y
            preferencias dietéticas.
          </p>
        </div>

        <div className="card">
          <div className="icon-container purple">
            <img src={img3}/>
          </div>
          <h2>Rutinas de Ejercicio</h2>
          <p>
            Complementa tu alimentación con rutinas diseñadas para alcanzar tus
            metas de salud.
          </p>
        </div>

        <div className="card">
          <div className="icon-container purple">
            <img src={img4}/>
          </div>
          <h2>Retos Comunitarios</h2>
          <p>
            Únete a desafíos de hábitos saludables y motívate junto a nuestra comunidad.
          </p>
        </div>

        <div className="card">
          <div className="icon-container yellow">
            <img src={img5}/>
          </div>
          <h2>Seguimiento de progreso</h2>
          <p>
            Monitorea tu avance con métricas simples y celebra tus logros diarios.
          </p>
        </div>

        <div className="card">
          <div className="icon-container pink">
            <img src={img6}/>
          </div>
          <h2>Ingredientes Locales</h2>
          <p>
            Prioriza recetas con ingredientes frescos y locales de tu región.
          </p>
        </div>


      </div>
    </section>
  );
}

export default Functionalities;
import "../styles/Impact.css";

function Impact(){
return (
    <>
        <section className="impacto">
      <ul className="impacto-list">
        <li className="impacto-item">
          <h3 className="impacto-num green">1,000+</h3>
          <p>Recetas Saludables</p>
        </li>

        <li className="impacto-item">
          <h3 className="impacto-num blue">5,000+</h3>
          <p>Usuarios Activos</p>
        </li>

        <li className="impacto-item">
          <h3 className="impacto-num purple">50+</h3>
          <p>Retos Completados</p>
        </li>

        <li className="impacto-item">
          <h3 className="impacto-num orange">95%</h3>
          <p>Satisfacción</p>
        </li>
      </ul>
    </section>

    <section className="how-section">
      <div className="how-header">
        <h1>Cómo funciona VitalFlow</h1>
        <p>
          Tres simples pasos para comenzar tu journey hacia una vida más
          saludable
        </p>
      </div>

      <div className="how-steps">
        <article className="how-step">
          <div className="step-circle circle-green">1</div>
          <h3 className="step-title">Crea tu Perfil</h3>
          <p className="step-desc">
            Completa tus datos personales, objetivos y preferencias alimentarias
            para personalizar tu experiencia.
          </p>
        </article>

        <article className="how-step">
          <div className="step-circle circle-blue">2</div>
          <h3 className="step-title">Recibe tu Plan</h3>
          <p className="step-desc">
            Nuestro algoritmo genera un plan alimenticio semanal personalizado
            basado en tus necesidades nutricionales.
          </p>
        </article>

        <article className="how-step">
          <div className="step-circle circle-purple">3</div>
          <h3 className="step-title">Sigue y Mejora</h3>
          <p className="step-desc">
            Participa en retos, sigue tu progreso y ajusta tu plan según vayas
            alcanzando tus metas.
          </p>
        </article>
      </div>
    </section>
    </>
)
}
export default Impact;
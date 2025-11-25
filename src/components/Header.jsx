import { useState } from "react";
import "../styles/header.css";

export default function Header({ onOpenLogin }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((s) => !s);
  const handleLink = (e, id) => {
    e.preventDefault();
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="vf-header">
      <div className="vf-header__left">VitalFlow</div>

      <nav className={`vf-nav ${open ? "open" : ""}`}>
        <ul>
          <li><a href="#home" onClick={(e) => handleLink(e, "home")}>Inicio</a></li>
          <li><a href="#func" onClick={(e) => handleLink(e, "func")}>Funcionalidades</a></li>
          <li><a href="#impact" onClick={(e) => handleLink(e, "impact")}>Impacto</a></li>
          <li><a href="#contact" onClick={(e) => handleLink(e, "contact")}>Contacto</a></li>
        </ul>
      </nav>

      <div className="vf-header__right">
        <button
  type="button"
  className="vf-login"
  onClick={() => {
    console.log("Abrir modal login");
    if (typeof onOpenLogin === "function") {
      onOpenLogin();
    } else {
      console.warn("onOpenLogin no es función (o no fue pasada).", onOpenLogin);
    }
  }}
>
  Ingresar
</button>
        <button className="vf-burger" onClick={handleToggle} aria-label="menu">
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
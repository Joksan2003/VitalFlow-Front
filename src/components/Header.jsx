// src/components/header.jsx
import { useState, useRef, useEffect } from "react";
import "../styles/header.css";

export default function Header({ onOpenLogin }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (open && headerRef.current && !headerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const handleToggle = () => setOpen((s) => !s);

  const handleLink = (e, id) => {
    e.preventDefault();
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenLogin = () => {
    console.log("Abrir modal login");
    if (typeof onOpenLogin === "function") {
      onOpenLogin();
    } else {
      console.warn("onOpenLogin no es función (o no fue pasada).", onOpenLogin);
    }
    // al abrir login cerramos menú móvil
    setOpen(false);
  };

  return (
    <header className="vf-header" ref={headerRef}>
      <div className="vf-header__left">VitalFlow</div>

      <nav className={`vf-nav ${open ? "open" : ""}`}>
        <ul>
          <li>
            <a href="#home" onClick={(e) => handleLink(e, "home")}>
              Inicio
            </a>
          </li>
          <li>
            <a href="#func" onClick={(e) => handleLink(e, "func")}>
              Funcionalidades
            </a>
          </li>
          <li>
            <a href="#impact" onClick={(e) => handleLink(e, "impact")}>
              Impacto
            </a>
          </li>
          <li>
            <a href="#contact" onClick={(e) => handleLink(e, "contact")}>
              Contacto
            </a>
          </li>

          {/* Botón de login dentro del menú (solo visible en mobile por CSS) */}
          <li className="vf-nav__mobile-login">
            <button type="button" onClick={handleOpenLogin}>
              Ingresar
            </button>
          </li>
        </ul>
      </nav>

      <div className="vf-header__right">
        {/* Botón login, visible sólo en desktop */}
        <button type="button" className="vf-login" onClick={handleOpenLogin}>
          Ingresar
        </button>

        <button
          className="vf-burger"
          onClick={handleToggle}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
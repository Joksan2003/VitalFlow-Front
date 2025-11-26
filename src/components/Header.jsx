// src/components/header.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/header.css";

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  const isActive = (path) =>
    location.pathname === path ? { textDecoration: "underline" } : {};

  return (
    <header className="vf-header">
      {/* Logo / Marca */}
      <div className="vf-header__left">
        <Link to="/" onClick={closeMenu}>
          VF
        </Link>
      </div>

      {/* Nav (usa .open en móvil) */}
      <nav className={`vf-nav ${open ? "open" : ""}`}>
        <ul>
          <li>
            <Link to="/" style={isActive("/")} onClick={closeMenu}>
              Inicio
            </Link>
          </li>
          <li>
            <a href="#features" onClick={closeMenu}>
              Funcionalidades
            </a>
          </li>
          <li>
            <a href="#faq" onClick={closeMenu}>
              Preguntas frecuentes
            </a>
          </li>

          {/* En móvil podrías mostrar aquí los botones de login/registro si quieres */}
        </ul>
      </nav>

      {/* Lado derecho: login + burger */}
      <div className="vf-header__right">
        <Link to="/login" onClick={closeMenu}>
          <button className="vf-login">Iniciar sesión</button>
        </Link>

        {/* Burger solo se ve en móvil (lo controla el CSS con @media) */}
        <button
          className="vf-burger"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
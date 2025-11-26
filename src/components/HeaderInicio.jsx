import { useState, useRef, useEffect } from "react";
import "../styles/headerInicio.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import imagenUsuario from "../assets/Usuario.png";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

export default function HeaderInicio() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navRef = useRef(null);
  const burgerRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleToggle = () => setOpen((s) => !s);

  useEffect(() => {
    function onDoc(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Cierra menú de navegación al tocar fuera en mobile
  useEffect(() => {
    function handleOutside(e) {
      if (!open) return;
      const isNav = navRef.current?.contains(e.target);
      const isBurger = burgerRef.current?.contains(e.target);
      if (!isNav && !isBurger) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const handleOpenProfile = () => setProfileOpen((s) => !s);

  const handleMiPerfil = () => {
    setProfileOpen(false);
    navigate("/perfil");
  };

  const handleNutriolgo = () => {
    setProfileOpen(false);
    navigate("/Solicitud-nutriologo");
  };

  const handleCerrarSesion = () => {
    logout();
    setProfileOpen(false);
  };

  // 🔐 roles
  const role = user?.role;
  const isNutri = role === "nutriologo";
  const isAdmin = role === "admin";
  const isPro = isNutri || isAdmin; // gente "profesional"

  const avatarSrc = (() => {
    const url = user?.avatarUrl;
    if (!url) return imagenUsuario;
    if (String(url).startsWith("http")) return url;
    return `${API}${url.startsWith("/") ? "" : "/"}${url}`.replace(
      /([^:])\/{2,}/g,
      "$1/"
    );
  })();

  const onAvatarError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = imagenUsuario;
  };

  return (
    <header className="vf-header">
      <div className="vf-header__left">VitalFlow</div>

      <nav ref={navRef} className={`vf-nav ${open ? "open" : ""}`}>
        <ul>
          {isPro ? (
            // 🔹 MENÚ PARA NUTRIÓLOGO Y ADMIN
            <>
              <li>
                <NavLink
                  to="/pantalla-inicio"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/recetas"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Recetas
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nutri/plans"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Planes
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/nutri/retos"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Retos
                </NavLink>
              </li>

              {/* Solo ADMIN ve Usuarios y Solicitudes */}
              {isAdmin && (
                <>
                  <li>
                    <NavLink
                      to="/admin/usuarios"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={() => setOpen(false)}
                    >
                      Usuarios
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/solicitudes"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={() => setOpen(false)}
                    >
                      Solicitudes
                    </NavLink>
                  </li>
                </>
              )}
            </>
          ) : (
            // 🔹 MENÚ PARA USUARIO NORMAL
            <>
              <li>
                <NavLink
                  to="/pantalla-inicio"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/recetas"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Recetas
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/mi-plan"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Mi Plan
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/retos"
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  Retos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/progreso"
                  className={({ isActive }) =>
                    `progreso-btn ${isActive ? "active" : ""}`
                  }
                  onClick={() => setOpen(false)}
                >
                  Progreso
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="vf-header__right">
        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-btn"
            onClick={handleOpenProfile}
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <img
              src={avatarSrc}
              alt="Avatar"
              className="vf-avatar"
              onError={onAvatarError}
            />
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu" aria-label="Perfil">
              <button
                type="button"
                className="profile-menu-item"
                onClick={handleMiPerfil}
              >
                Mi Perfil
              </button>

              {/* Solo usuario normal puede solicitar rol nutriólogo */}
              {!isNutri && !isAdmin && (
                <button
                  type="button"
                  className="profile-menu-item"
                  onClick={handleNutriolgo}
                >
                  Solicitar rol Nutriólogo
                </button>
              )}

              <button
                type="button"
                className="profile-menu-item danger"
                onClick={handleCerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <button
          ref={burgerRef}
          className="vf-burger"
          onClick={handleToggle}
          aria-label="menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

// src/components/LoginModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/LoginModal.css";

export default function LoginModal({ open = false, onClose = () => {} }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // controla qué vista (sign up / sign in)
  const [active, setActive] = useState(false);

  // form states - sign up
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  // form states - sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // bloquear scroll cuando modal abierto
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // si el modal se abre, resetea errores/inputs (opcional)
  useEffect(() => {
    if (open) {
      setError("");
      setSiEmail("");
      setSiPassword("");
      setSuName("");
      setSuEmail("");
      setSuPassword("");
      setActive(false); // por defecto mostrar Sign In
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    // si quieres que el usuario pueda cerrar haciendo click fuera, descomenta:
    // onClose();
  };

  // SIGN UP submit
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!suEmail || !suPassword) throw new Error("Completa email y contraseña");
      // llama al register del contexto (debe guardar token y user)
      await register({ name: suName, email: suEmail, password: suPassword });
      setLoading(false);
      onClose();
      navigate("/pantalla-inicio");
    } catch (err) {
      console.error("register error:", err);
      setError(err.message || "Error al registrarse");
      setLoading(false);
    }
  };

  // SIGN IN submit
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!siEmail || !siPassword) throw new Error("Completa email y contraseña");
      await login({ email: siEmail, password: siPassword });
      setLoading(false);
      onClose();
      navigate("/pantalla-inicio");
    } catch (err) {
      console.error("login error:", err);
      setError(err.message || "Error en credenciales");
      setLoading(false);
    }
  };

  return (
    <div className="vf-auth-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div
        id="container"
        className={`container ${active ? "active" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* SIGN UP */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignUp}>
            <h1>Crea una cuenta</h1>

            <div className="social-icons">
              <a href="#" className="icon" aria-label="google"><i className="fa-brands fa-google-plus-g" /></a>
              <a href="#" className="icon" aria-label="facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#" className="icon" aria-label="github"><i className="fa-brands fa-github" /></a>
              <a href="#" className="icon" aria-label="linkedin"><i className="fa-brands fa-linkedin-in" /></a>
            </div>

            <span>Utiliza tu correo para registrarte</span>

            <input
              type="text"
              placeholder="Name"
              value={suName}
              onChange={(e) => setSuName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
              required
            />

            {error && <div className="vf-error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Regístrate"}
            </button>
          </form>
        </div>

        {/* SIGN IN */}
        <div className="form-container sign-in">
          <form onSubmit={handleSignIn}>
            <h1>Inicia sesión</h1>

            <div className="social-icons">
              <a href="#" className="icon" aria-label="google"><i className="fa-brands fa-google-plus-g" /></a>
              <a href="#" className="icon" aria-label="facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#" className="icon" aria-label="github"><i className="fa-brands fa-github" /></a>
              <a href="#" className="icon" aria-label="linkedin"><i className="fa-brands fa-linkedin-in" /></a>
            </div>

            <span>Utiliza tu correo y contraseña</span>

            <input
              type="email"
              placeholder="Correo"
              value={siEmail}
              onChange={(e) => setSiEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={siPassword}
              onChange={(e) => setSiPassword(e.target.value)}
              required
            />

            {error && <div className="vf-error">{error}</div>}

            <a
              href="#"
              className="forgot"
              onClick={(e) => {
                e.preventDefault();
                onClose();          // cierra el modal
                navigate('/forgot-password'); // te lleva a la pantalla de recuperación
              }}
            >
              ¿Olvidaste tu contraseña?
            </a>
            <button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Iniciar sesion"}
            </button>
          </form>
        </div>

        {/* TOGGLE PANEL (controls the animation) */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Bienvenido de vuelta!</h1>
              <p>Ingresa tus datos para iniciar sesion</p>
              {/* This button switches to Sign In view (remove 'active') */}
              <button
                className="hidden"
                type="button"
                id="login"
                onClick={() => setActive(false)}
              >
                Iniciar sesión
              </button>
            </div>

            <div className="toggle-panel toggle-right">
              <h1>Hola, Amigo!</h1>
              <p>Registra tus datos personales para poder ingresar a este sitio</p>
              {/* This button switches to Sign Up view (add 'active') */}
              <button
                className="hidden"
                type="button"
                id="register"
                onClick={() => setActive(true)}
              >
                Regístrate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
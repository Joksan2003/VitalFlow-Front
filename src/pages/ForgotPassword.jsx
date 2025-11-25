// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { post } from "../utils/api";
import "../styles/ForgotReset.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!email) {
      setError("Por favor ingresa tu correo");
      return;
    }

    setLoading(true);
    try {
      // Llama a tu backend: POST /api/auth/forgot-password
      const res = await post("/api/auth/forgot-password", { email });
      setMsg(res.msg || "Si el correo existe, se ha enviado el enlace.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Error al solicitar recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fr-root">
      <div className="fr-card">
        <h1>¿Olvidaste tu contraseña?</h1>
        <p className="fr-sub">
          Escribe el correo con el que te registraste en VitalFlow. Te enviaremos
          un enlace para crear una nueva contraseña.
        </p>

        <form onSubmit={handleSubmit} className="fr-form">
          <label>
            Correo electrónico
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {msg && <div className="fr-msg ok">{msg}</div>}
          {error && <div className="fr-msg error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
          <button
            type="button"
            className="fr-back-btn"
            onClick={() => window.location.href = "/"}
            style={{ marginTop: "12px", background: "#ccc", color: "#000" }}
          >
            Volver al inicio
          </button>
        </form>
      </div>
    </main>
  );
}
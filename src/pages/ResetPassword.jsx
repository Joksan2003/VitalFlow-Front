// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { post } from "../utils/api";
import "../styles/ForgotReset.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const token = query.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!token) {
      setError("Token no válido");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await post("/api/auth/reset-password", { token, password });
      setMsg(res.msg || "Contraseña actualizada");
      // Opcional: redirigir después de unos segundos
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || err.message || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fr-root">
      <div className="fr-card">
        <h1>Crear nueva contraseña</h1>
        <p className="fr-sub">
          Escribe tu nueva contraseña. Asegúrate de recordarla para futuros ingresos.
        </p>

        <form onSubmit={handleSubmit} className="fr-form">
          <label>
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Repetir contraseña
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </label>

          {msg && <div className="fr-msg ok">{msg}</div>}
          {error && <div className="fr-msg error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>

        <button className="fr-back" type="button" onClick={() => navigate("/")}>
          Ir al inicio
        </button>
      </div>
    </main>
  );
}
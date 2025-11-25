import { useEffect, useState } from "react";
import {
  listChallenges,
  joinChallenge,
  myActive,
  markChallenge,
  myCompleted,
} from "../services/challengeService";
import { useAuth } from "../contexts/AuthContext";

import "../styles/retos.css";

export default function Retos() {
  const [tab, setTab] = useState("available"); // 'available' | 'my' | 'completed'
  const [challenges, setChallenges] = useState([]);
  const [myActiveList, setMyActiveList] = useState([]);
  const [myCompletedList, setMyCompletedList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    open: false,
    type: "success", // 'success' | 'error' | 'info'
    title: "",
    message: "",
  });

  function showFeedback(type, title, message) {
    setFeedback({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeFeedback() {
    setFeedback((prev) => ({ ...prev, open: false }));
  }
  const { token } = useAuth();

  useEffect(() => {
    fetchAvailable();
    if (token) {
      fetchMyActive();
      fetchMyCompleted();
    } else {
      setMyActiveList([]);
      setMyCompletedList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchAvailable() {
    try {
      setLoading(true);
      const res = await listChallenges({ page: 1, limit: 12 });
      setChallenges(res.data || []);
    } catch (err) {
      console.error("fetchAvailable", err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyActive() {
    try {
      const res = await myActive(token);
      setMyActiveList(res.active || []);
    } catch (err) {
      console.error("fetchMyActive", err);
      setMyActiveList([]);
    }
  }

  async function fetchMyCompleted() {
    try {
      const res = await myCompleted(token);
      setMyCompletedList(res.completed || []);
    } catch (err) {
      console.error("fetchMyCompleted", err);
      setMyCompletedList([]);
    }
  }

  async function handleJoin(id) {
    try {
      await joinChallenge(token, id);
      await fetchMyActive();
      showFeedback(
        "success",
        "Reto agregado",
        "El reto se agregó correctamente a tus retos activos."
      );
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.msg || "Ocurrió un error al unirte al reto.";
      showFeedback("error", "No se pudo unir al reto", msg);
    }
  }

  async function handleMark(challengeIdOrObj) {
    // challengeIdOrObj puede ser id o un objeto challenge
    const id =
      typeof challengeIdOrObj === "string"
        ? challengeIdOrObj
        : challengeIdOrObj?._id || challengeIdOrObj;

    try {
      await markChallenge(token, id);
      await fetchMyActive();
      showFeedback(
        "success",
        "Día marcado",
        "Tu progreso se actualizó correctamente. Vuelve mañana para marcar el siguiente día."
      );
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.msg || "Ocurrió un error al marcar el reto.";
      const lower = msg.toLowerCase();

      // Si el backend avisa que debe esperar 24 horas, mostramos un modal informativo.
      if (lower.includes("24 horas") || lower.includes("24h")) {
        showFeedback("info", "Debes esperar 24 horas", msg);
      } else {
        showFeedback("error", "No se pudo marcar el día", msg);
      }
    }
  }

  // small summary numbers shown as trophies
  const totalCompleted = myCompletedList.length || 0;
  const totalActive = myActiveList.length || 0;
  const totalStreakDays = myActiveList.reduce((acc, a) => acc + (a.streak || 0), 0);
  const totalPoints = myCompletedList.reduce((s, c) => s + (c.totalPoints || 0), 0);

  return (
    <main className="retos-container">
      <header className="retos-header">
        <div>
          <h1 className="retos-title">Retos y Rutinas</h1>
          <p className="retos-sub">Únete a retos comunitarios y desarrolla hábitos saludables junto a otros usuarios</p>
        </div>
      </header>

      {/* trophy summary */}
      <section className="trophies-grid">
        <div className="trophy-card">
          <div className="trophy-ico">🏆</div>
          <div className="trophy-num">{totalCompleted}</div>
          <div className="trophy-label">Retos Completados</div>
        </div>

        <div className="trophy-card">
          <div className="trophy-ico">📈</div>
          <div className="trophy-num">{totalActive}</div>
          <div className="trophy-label">Retos Activos</div>
        </div>

        <div className="trophy-card">
          <div className="trophy-ico">🔥</div>
          <div className="trophy-num">{totalStreakDays}</div>
          <div className="trophy-label">Días de Racha</div>
        </div>

        <div className="trophy-card">
          <div className="trophy-ico">🎖️</div>
          <div className="trophy-num">{totalPoints}</div>
          <div className="trophy-label">Puntos Ganados</div>
        </div>
      </section>

      {/* tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "available" ? "active" : ""}`} onClick={() => setTab("available")}>Disponibles</button>
        <button className={`tab ${tab === "my" ? "active" : ""}`} onClick={() => setTab("my")}>Mis Retos</button>
        <button className={`tab ${tab === "completed" ? "active" : ""}`} onClick={() => setTab("completed")}>Completados</button>
      </div>

      {/* content */}
      {tab === "available" && (
        <section className="cards-grid">
          {loading && <div className="muted">Cargando retos...</div>}
          {!loading && challenges.length === 0 && <div className="muted">No hay retos disponibles</div>}
          {!loading && challenges.map((c) => (
            <article key={c._id} className={`card ${c.isActive === false ? "completed" : ""}`} style={{ position: "relative" }}>
              {/* badge: muestra "Finalizado" si isActive===false, o "En curso" */}

              {c.imageUrl ? <img src={c.imageUrl} alt={c.title} className="card-img" /> : <div className="card-img placeholder" />}
              <div className="card-body">
                <h3>{c.title}</h3>
                <p className="muted">{c.description}</p>
                <div className="meta">
                  <span>⏱ {c.durationDays} días</span>
                  <span>🏅 {c.rewardPoints} pts</span>
                </div>
                <div className="actions">
                  <button onClick={() => handleJoin(c._id)} className="btn-outline">Agregar</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "my" && (
        <section className="my-grid">
          {myActiveList.length === 0 && <div className="muted">No tienes retos activos</div>}
          {myActiveList.map((a) => {
            const challenge = a.challengeId || {};
            const challengeId = challenge._id || a.challengeId;
            return (
              <div key={challengeId} className="my-challenge">
                <div className="my-top">
                  <h4>{challenge.title}</h4>
                  <div className="status in-progress">En progreso</div>
                </div>
                <p className="muted">{challenge.description}</p>
               <div className="progress">
                Progreso del reto
                <div className="progress-bar" aria-hidden>
                  <div
                    className="fill"
                    style={{ width: `${Math.round((a.completedDays / (challenge.durationDays || 1)) * 100)}%` }}
                  />
                </div>
                <div style={{ textAlign: 'right', color: '#64748b', marginTop: 6 }}>
                  {a.completedDays}/{challenge.durationDays} días
                </div>
              </div>
                <div className="meta small">Racha: {a.streak || 0} días</div>
                <div className="actions">
                  <button onClick={() => handleMark(challengeId)} className="btn">Marcar completado</button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tab === "completed" && (
        <section className="cards-grid">
          {myCompletedList.length === 0 && <div className="muted">No hay retos completados</div>}
          {myCompletedList.map((c) => {
            const ch = c.challengeId || {};
            const chId = ch._id || c.challengeId;
            return (
              <article key={chId} className="card completed" style={{ position: "relative" }}>
                <div className="status-badge">🏆 Completado</div>
                <div className="card-body">
                  <h3>{ch.title}</h3>
                  <p className="muted">Completado el {new Date(c.finishedAt).toLocaleDateString()}</p>
                  <div className="meta">
                    <span>{ch.durationDays} días</span>
                    <span>{c.totalPoints} pts</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {feedback.open && (
        <div className="retos-modal-backdrop" onClick={closeFeedback}>
          <div
            className={`retos-modal retos-modal-${feedback.type}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="retos-modal-header">
              <span className="retos-modal-icon">
                {feedback.type === "success" && "✅"}
                {feedback.type === "error" && "⚠️"}
                {feedback.type === "info" && "ℹ️"}
              </span>
              <h3>{feedback.title}</h3>
            </div>
            <p className="retos-modal-message">{feedback.message}</p>
            <button className="retos-modal-btn" onClick={closeFeedback}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
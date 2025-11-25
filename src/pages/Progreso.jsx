// src/pages/Progreso.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "../styles/progreso.css";
import { myActive, myCompleted } from "../services/challengeService";
import { obtenerMiPlan } from "../services/planService";

const API = "http://localhost:4080/api";

// Día de hoy como índice de arreglo: 0 = domingo, 1 = lunes, ... 6 = sábado
function getTodayArrayIndex(length) {
  if (!length) return 0;
  const jsDay = new Date().getDay(); // 0-dom, 1-lun, ..., 6-sab
  return jsDay % length; // por si length < 7
}

export default function Progreso() {
  const { token } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // estadísticas numéricas para los tiles
  const [stats, setStats] = useState({
    streakDays: 0,
    challengesCompleted: 0,
    activeChallenges: 0,
    totalPoints: 0,
    recipesCooked: 0,
  });

  // progreso de la semana / calorías
  const [weekProgress, setWeekProgress] = useState({
    daysDone: 0,
    weekTarget: 7,
    caloriesToday: 0,
    caloriesGoal: 2000,
  });

  // plan de hoy (solo el día actual del plan)
  const [todayPlan, setTodayPlan] = useState([]); // [{ meal, title, kcal }]

  // datos para la parte derecha
  const [activeChallengesList, setActiveChallengesList] = useState([]);
  const [completedChallengesList, setCompletedChallengesList] = useState([]);
  const [habits, setHabits] = useState([]); // hábitos formados
  const [timeline, setTimeline] = useState([]); // eventos recientes
  const [suggestions, setSuggestions] = useState([]); // tips

  useEffect(() => {
    if (!token) {
      fetchPublicData();
    } else {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ----------------------------
  // CARGA DE DATOS PRINCIPAL
  // ----------------------------
  async function fetchAll() {
    setLoading(true);
    try {
      // 1) Usuario autenticado
      const meRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = meRes.data.user || null;
      setUser(me);

      // 2) Retos activos y completados
      let active = [];
      let completed = [];
      try {
        const resA = await myActive(token);
        active = resA.active || [];
      } catch (err) {
        console.warn("myActive:", err?.message || err);
      }
      try {
        const resC = await myCompleted(token);
        completed = resC.completed || [];
      } catch (err) {
        console.warn("myCompleted:", err?.message || err);
      }
      setActiveChallengesList(active);
      setCompletedChallengesList(completed);

      // 3) Recetas relacionadas con el usuario (cocinadas / generadas)
      let recipesCookedCount = 0;
      try {
        const rc = await axios.get(`${API}/recipes/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        recipesCookedCount = Array.isArray(rc.data.data)
          ? rc.data.data.length
          : rc.data.count || 0;
      } catch (err) {
        console.warn("recipes/me:", err?.message || err);
      }

      // 4) Plan actual: usar solo un día según la posición en el arreglo (0–6)
      let planObj = null;
      let todayMealsRaw = [];
      let planDayIndex = 0; // índice del día actual dentro del plan (0-based)
      let fullDayCalories = 0; // total de kcal del día
      let partialCalories = 0; // kcal acumuladas según la hora

      try {
        // ⚠️ Usamos el MISMO servicio que en MiPlan.jsx
        const planRes = await obtenerMiPlan(token); // GET /api/plans/me
        const plans = planRes.data || planRes.plans || [];
        if (Array.isArray(plans) && plans.length > 0) {
          // Tomamos el plan más reciente (mismo criterio que en MiPlan.jsx)
          planObj = plans[0];
        } else {
          planObj = null;
        }
      } catch (err) {
        console.warn("plans/me:", err?.message || err);
      }

      if (planObj && Array.isArray(planObj.dias) && planObj.dias.length) {
        const idx = getTodayArrayIndex(planObj.dias.length); // 0–6
        planDayIndex = idx;
        const todayEntry = planObj.dias[idx] || planObj.dias[0];

        todayMealsRaw = Array.isArray(todayEntry?.comidas)
          ? todayEntry.comidas
          : [];

        // kcal por comida del día
        const mealKcals = todayMealsRaw.map((meal) => {
          const kcal =
            meal.receta?.kcal ??
            meal.kcal ??
            meal.calorias_aprox ??
            meal.caloriasAprox ??
            meal.recetaKcal ??
            0;
          return Number(kcal) || 0;
        });

        // 1) total de calorías del día
        fullDayCalories = mealKcals.reduce((sum, v) => sum + v, 0);

        // 2) calorías parciales según la hora actual
        const hour = new Date().getHours(); // 0–23
        if (mealKcals.length > 0) {
          if (hour < 8) {
            // solo primera comida (ej. desayuno)
            partialCalories = mealKcals[0];
          } else if (hour < 15) {
            // primeras dos comidas (desayuno + comida)
            partialCalories = mealKcals.slice(0, 2).reduce((s, v) => s + v, 0);
          } else {
            // resto del día: todas las comidas
            partialCalories = fullDayCalories;
          }
        } else {
          partialCalories = 0;
        }
      }

      // mapeo para el front (Tu plan de hoy)
      const mappedToday = todayMealsRaw.map((meal) => ({
        meal: meal.nombre || "Comida",
        title:
          meal.recetaTitle ||
          meal.receta?.title ||
          (meal.recetaId ? "Receta (ver detalle)" : "Receta generada por IA"),
        kcal:
          meal.receta?.kcal ??
          meal.kcal ??
          meal.calorias_aprox ??
          meal.recetaKcal ??
          0,
      }));
      setTodayPlan(mappedToday);

      // 5) Calcular estadísticas para los tiles
      const streakDays = active.reduce((acc, a) => acc + (a.streak || 0), 0);
      const challengesCompleted = completed.length;
      const activeChallenges = active.length;
      const totalPoints = completed.reduce(
        (s, c) => s + (c.totalPoints || 0),
        0
      );

      setStats({
        streakDays,
        challengesCompleted,
        activeChallenges,
        totalPoints,
        recipesCooked: recipesCookedCount,
      });

      // 6) Actualizar progreso semanal (daysDone, goal, calorías)
      if (planObj) {
        const baseGoal =
          fullDayCalories > 0
            ? fullDayCalories
            : planObj.recommendedCalories ||
              me?.recommendedCalories ||
              weekProgress.caloriesGoal;

        setWeekProgress((wp) => ({
          ...wp,
          // usamos el índice del día actual (0-based) + 1 para mostrar, por ejemplo, "3/7 días"
          daysDone: planDayIndex + 1,
          // si el plan tiene arreglo de días, usamos su longitud como objetivo semanal
          weekTarget:
            (Array.isArray(planObj.dias) && planObj.dias.length) ||
            planObj.duration ||
            wp.weekTarget ||
            7,
          // calorías acumuladas de hoy según la hora
          caloriesToday: partialCalories || 0,
          // objetivo = total de kcal del día
          caloriesGoal: baseGoal,
        }));
      } else {
        setWeekProgress((wp) => ({
          ...wp,
          caloriesToday: 0,
          caloriesGoal: me?.recommendedCalories || wp.caloriesGoal,
        }));
      }

      // 7) Hábitos desde retos
      buildHabitsFromChallenges(completed);

      // 8) Timeline (eventos recientes)
      buildTimeline({ completed, active, planObj });

      // 9) Sugerencias
      buildSuggestions({
        me,
        stats: { streakDays, challengesCompleted, activeChallenges },
      });
    } catch (err) {
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPublicData() {
    setLoading(true);
    try {
      try {
        const pub = await axios.get(`${API}/users/me`);
        setUser(pub.data.user || null);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------
  // HELPERS
  // ----------------------------

  function buildHabitsFromChallenges(completed) {
    if (!completed || !completed.length) {
      setHabits([]);
      return;
    }

    const names = completed
      .map(
        (c) => c.challengeId?.title || c.challengeId?.name || "Reto completado"
      )
      .filter(Boolean);

    const mapped = names.map((name) => {
      const lower = name.toLowerCase();
      if (lower.includes("hidrat")) return "Tomar agua diariamente";
      if (lower.includes("vegetal") || lower.includes("verdura"))
        return "Incluir verduras en tus comidas";
      if (lower.includes("ejercicio") || lower.includes("pasos"))
        return "Moverte todos los días";
      return `Hábito: ${name}`;
    });

    const unique = Array.from(new Set(mapped));
    setHabits(unique);
  }

  function buildTimeline({ completed, active, planObj }) {
    const events = [];

    if (planObj) {
      events.push({
        label: "Se generó tu último plan de alimentación",
        date: planObj.createdAt || null,
      });
    }

    (completed || [])
      .slice(0, 3)
      .forEach((c) => {
        events.push({
          label: `Completaste el reto "${c.challengeId?.title || "Reto"}"`,
          date: c.finishedAt || c.updatedAt || null,
        });
      });

    (active || [])
      .slice(0, 2)
      .forEach((a) => {
        events.push({
          label: `Te uniste a "${a.challengeId?.title || "Reto"}"`,
          date: a.joinedAt || null,
        });
      });

    setTimeline(events);
  }

  function buildSuggestions({ me, stats }) {
    const sug = [];

    if (!me) {
      sug.push("Inicia sesión para ver recomendaciones personalizadas.");
      setSuggestions(sug);
      return;
    }

    if (stats.challengesCompleted === 0) {
      sug.push("Completa tu primer reto para empezar a ganar confianza 💪.");
    } else if (stats.challengesCompleted < 3) {
      sug.push(
        "Vas muy bien, sigue completando retos para formar hábitos sólidos."
      );
    } else {
      sug.push(
        "Ya tienes un buen historial de retos, ¡piensa en subir un nivel de dificultad!"
      );
    }

    if (stats.streakDays === 0) {
      sug.push(
        "Intenta no romper la cadena: mantén una racha de al menos 3 días seguidos."
      );
    } else if (stats.streakDays >= 7) {
      sug.push("Tu racha es increíble. No la pierdas, vas construyendo disciplina real.");
    }

    if (me.goal === "perder_peso") {
      sug.push(
        "Revisa tus calorías diarias y prioriza recetas con alta saciedad y pocas calorías."
      );
    } else if (me.goal === "ganar_masa") {
      sug.push("Procura incluir una fuente de proteína en cada comida principal.");
    }

    setSuggestions(sug);
  }

  const weekPct = Math.min(
    100,
    Math.round(
      weekProgress.weekTarget
        ? (weekProgress.daysDone / weekProgress.weekTarget) * 100
        : 0
    )
  );

  const caloriesPct = Math.min(
    100,
    Math.round(
      weekProgress.caloriesGoal
        ? (weekProgress.caloriesToday / weekProgress.caloriesGoal) * 100
        : 0
    )
  );

  const displayDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <main className="progreso-page">
      <div className="progreso-layout">
        <h1 className="pg-title">¡Hola{user ? `, ${user.name}` : ""}! 👋</h1>
        <p className="pg-sub">
          Aquí tienes un resumen de tu progreso hacia una vida más saludable
        </p>

        {/* --------- TILES SUPERIORES (LOS DEJAMOS IGUAL) --------- */}
        <section className="pg-tiles">
          <article className="tile">
            <div className="tile-top">
              <span className="tile-icon fire">🔥</span>
              <span className="tile-top-label">Días de racha</span>
            </div>
            <div className="tile-number">{stats.streakDays}</div>
            <div className="tile-foot">Suma de tus retos activos</div>
          </article>

          <article className="tile">
            <div className="tile-top">
              <span className="tile-icon trophy">🏆</span>
              <span className="tile-top-label">Retos completados</span>
            </div>
            <div className="tile-number">{stats.challengesCompleted}</div>
            <div className="tile-foot">Historial total</div>
          </article>

          <article className="tile">
            <div className="tile-top">
              <span className="tile-icon pulse">📈</span>
              <span className="tile-top-label">Retos activos</span>
            </div>
            <div className="tile-number">{stats.activeChallenges}</div>
            <div className="tile-foot">Retos que sigues hoy</div>
          </article>

          <article className="tile">
            <div className="tile-top">
              <span className="tile-icon medal">🎖️</span>
              <span className="tile-top-label">Puntos ganados</span>
            </div>
            <div className="tile-number">{stats.totalPoints}</div>
            <div className="tile-foot">Acumulados por retos</div>
          </article>
        </section>

        {/* Progreso de la semana */}
        <section className="card card-full">
          <h3 className="card-h">Progreso de la semana</h3>
          <div className="progress-row">
            <div className="progress-label">Objetivo semanal de actividad</div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${weekPct}%` }}
              />
            </div>
            <div className="progress-small">
              {weekProgress.daysDone}/{weekProgress.weekTarget} días
            </div>
          </div>
          <div className="progress-row" style={{ marginTop: 16 }}>
            <div className="progress-label">Calorías de hoy</div>
            <div className="progress-bar progress-bar--light">
              <div
                className="progress-fill progress-fill--green"
                style={{ width: `${caloriesPct}%` }}
              />
            </div>
            <div className="progress-small">
              {weekProgress.caloriesToday}/{weekProgress.caloriesGoal} kcal
            </div>
          </div>
        </section>

        {/* Mis retos y Actividad reciente */}
        <div className="row">
          <section className="card card-small">
            <h3 className="card-h">Mis retos</h3>
            <div className="mini-list">
              {activeChallengesList.length === 0 && (
                <div className="muted">
                  No tienes retos activos. Ve a la sección “Retos” para unirte a
                  uno.
                </div>
              )}
              {activeChallengesList.slice(0, 3).map((a) => (
                <div
                  className="mini-item"
                  key={a._id || a.challengeId?._id}
                >
                  <div className="mini-title">
                    {a.challengeId?.title || "Reto activo"}
                  </div>
                  <div className="mini-meta">
                    Racha: {a.streak || 0} días • Completado:{" "}
                    {a.completedDays || 0} días
                  </div>
                </div>
              ))}
            </div>
            <button
              className="link-btn"
              onClick={() => (window.location.href = "/retos")}
            >
              Ver todos los retos
            </button>
          </section>
          <section className="card card-small">
            <h3 className="card-h">Actividad reciente</h3>
            {timeline.length === 0 && (
              <div className="muted">
                Aún no registramos actividad reciente. Completa retos o genera
                un plan para comenzar tu historial.
              </div>
            )}
            {timeline.map((ev, idx) => (
              <div className="plan-row" key={idx}>
                <div className="plan-title">{ev.label}</div>
                <div className="plan-kcal">
                  {displayDate(ev.date) || "Reciente"}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Tu plan de hoy */}
        <section className="card card-full">
          <div className="card-header-row">
            <div>
              <h3 className="card-h">Tu plan de hoy</h3>
              <p className="card-sub">
                Revisa el resumen de tus comidas para el día de hoy.
              </p>
            </div>
            <button
              className="btn-green"
              onClick={() => (window.location.href = "/mi-plan")}
            >
              Ver plan completo
            </button>
          </div>
          <div className="plan-list">
            {loading && (
              <div className="muted">Cargando tu plan actual...</div>
            )}
            {!loading && todayPlan.length === 0 && (
              <div className="muted">
                No tienes un plan para hoy. Genera uno desde la sección “Mi
                Plan”.
              </div>
            )}
            {todayPlan.map((p, idx) => (
              <div className="plan-row" key={idx}>
                <div>
                  <div className="plan-meal">{p.meal}</div>
                  <div className="plan-title">{p.title}</div>
                </div>
                <div className="plan-kcal">{p.kcal} kcal</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tu perfil nutricional */}
        <div className="row single-col">
          <section className="card card-small">
            <h3 className="card-h">Tu perfil nutricional</h3>
            <div className="kv">
              <span>Objetivo:</span>{" "}
              <strong>{user?.goal || "No definido"}</strong>
            </div>
            <div className="kv">
              <span>Dieta principal:</span>{" "}
              {(user?.diets || []).length > 0 ? (
                <span className="pill">{user.diets[0]}</span>
              ) : (
                "—"
              )}
            </div>
            <div className="kv">
              <span>Calorías diarias:</span>{" "}
              <strong>
                {weekProgress.caloriesGoal ||
                  user?.recommendedCalories ||
                  "—"}{" "}
                kcal
              </strong>
            </div>
            <div className="kv kv--wrap">
              <span>Alergias:</span>{" "}
              {(user?.allergies || []).length === 0 &&
                "Ninguna registrada"}
              {(user?.allergies || []).map((a) => (
                <span key={a} className="pill">
                  {a}
                </span>
              ))}
            </div>
            {habits.length > 0 && (
              <>
                <h4 className="card-h card-h--small">Hábitos formados</h4>
                <ul className="mini-list">
                  {habits.map((h) => (
                    <li className="mini-item" key={h}>
                      <div className="mini-title">{h}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {suggestions.length > 0 && (
              <>
                <h4 className="card-h card-h--small">Sugerencias para ti</h4>
                <ul className="mini-list">
                  {suggestions.map((s, idx) => (
                    <li className="mini-item" key={idx}>
                      <div className="mini-meta">{s}</div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button
              className="btn-outline full"
              onClick={() => (window.location.href = "/perfil")}
            >
              Ver y editar perfil
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
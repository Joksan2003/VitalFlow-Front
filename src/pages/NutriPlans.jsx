// src/pages/NutriPlans.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "../styles/NutriPlans.css";
import RecipeModal from "../components/RecipeModal";
import CreateRecipeModalNutri from "../components/CreateRecipeModalNutri";

const API_URL = import.meta.env.VITE_API_URL + "/plans";

export default function NutriPlans() {
  const { token } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

// estados existentes...
const [approving, setApproving] = useState(false);
const [approveNotes, setApproveNotes] = useState("");

// 👇 NUEVOS
const [confirmOpen, setConfirmOpen] = useState(false);
const [toast, setToast] = useState({
  open: false,
  message: "",
  type: "success", // 'success' | 'error'
});

  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchPlans() {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data?.plans || [];
      setPlans(list);

      if (!selectedPlan && list.length > 0) {
        const pending = list.find((p) => p.status === "pending_review");
        const first = pending || list[0];
        setSelectedPlan(first);
        setApproveNotes(first.reviewerNotes || "");
      }
    } catch (err) {
      console.error("Error al cargar planes:", err);
      setError(
        err?.response?.data?.msg || "Error al cargar la lista de planes."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredPlans = useMemo(() => {
    let res = [...plans];

    if (statusFilter !== "all") {
      res = res.filter((p) => p.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter((p) => {
        const userName = p.userId?.name?.toLowerCase() || "";
        const userEmail = p.userId?.email?.toLowerCase() || "";
        const objetivo = p.meta?.objetivo?.toLowerCase() || "";
        const dieta = p.meta?.dieta?.toLowerCase() || "";
        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          objetivo.includes(q) ||
          dieta.includes(q)
        );
      });
    }

    return res;
  }, [plans, statusFilter, search]);

  function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    setApproveNotes(plan.reviewerNotes || "");
  }

  function formatDate(d) {
    if (!d) return "-";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusLabel(st) {
    if (st === "pending_review") return "Pendiente";
    if (st === "approved") return "Aprobado";
    if (st === "rejected") return "Rechazado";
    if (st === "active") return "Activo con usuario";
    return st;
  }

  async function handleApprovePlan() {
  if (!selectedPlan) return;

  try {
    setApproving(true);

    await axios.patch(
      `${API_URL}/${selectedPlan._id}/approve`,
      { notes: approveNotes },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await fetchPlans();

    // cerrar modal de confirmación
    setConfirmOpen(false);

    // mostrar toast bonito
    setToast({
      open: true,
      message: "Plan aprobado correctamente 🎉",
      type: "success",
    });
  } catch (err) {
    console.error("Error al aprobar plan:", err);

    setToast({
      open: true,
      message:
        err?.response?.data?.msg ||
        "Error al aprobar el plan. Revisa la consola.",
      type: "error",
    });
  } finally {
    setApproving(false);
  }
}

  // 🔍 VER RECETA (solo lectura)
  async function handleOpenRecipe(meal) {
    if (!meal) return;

    // 1) Si el plan ya trae receta embebida con ingredientes/steps
    if (meal.receta && Array.isArray(meal.receta.ingredients)) {
      const r = {
        ...meal.receta,
        _id: meal.recetaId,
        title: meal.receta.title || meal.recetaTitle || "Receta de plan",
        kcal: meal.receta.kcal ?? meal.calorias_aprox ?? 0,
      };
      setSelectedRecipe(r);
      setRecipeModalOpen(true);
      return;
    }

    // 2) Si solo tenemos recetaId -> pedirla al backend
    if (meal.recetaId) {
      try {
        setRecipeLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/recipes/${meal.recetaId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = res.data?.data || res.data?.recipe || null;
        if (data) {
          setSelectedRecipe(data);
          setRecipeModalOpen(true);
        } else {
          alert("No se encontró detalle de la receta.");
        }
      } catch (err) {
        console.error("Error al cargar receta:", err);
        alert(
          err?.response?.data?.msg ||
            "Error al obtener detalle de la receta."
        );
      } finally {
        setRecipeLoading(false);
      }
    } else {
      alert("Esta comida no tiene una receta vinculada todavía.");
    }
  }

  // ✏️ EDITAR RECETA (abre modal de edición)
  async function handleEditRecipe(meal) {
    if (!meal || !meal.recetaId) {
      alert("Esta comida no tiene una receta vinculada para editar.");
      return;
    }

    try {
      setRecipeLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/recipes/${meal.recetaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = res.data?.data || res.data?.recipe || null;
      if (!data) {
        alert("No se encontró el detalle de la receta para editar.");
        return;
      }
      setEditRecipe(data);
      setEditModalOpen(true);
    } catch (err) {
      console.error("Error al cargar receta para editar:", err);
      alert(
        err?.response?.data?.msg ||
          "Error al obtener el detalle de la receta para editar."
      );
    } finally {
      setRecipeLoading(false);
    }
  }

  return (
    <main className="nutri-plans">
      <header className="nutri-plans__header">
        <div>
          <h1 className="nutri-plans__title">Revisión de planes</h1>
          <p className="nutri-plans__subtitle">
            Revisa los planes generados por la IA para tus pacientes, ajusta
            recetas y apruébalos antes de que se activen.
          </p>
        </div>
      </header>

      <section className="nutri-plans__toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">Estado</label>
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending_review">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="active">Activos</option>
          </select>
        </div>

        <div className="toolbar-group toolbar-group--grow">
          <label className="toolbar-label">Buscar</label>
          <input
            className="toolbar-input"
            type="text"
            placeholder="Paciente, correo, objetivo o dieta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-status">
          {loading && <span className="toolbar-badge">Cargando planes...</span>}
          {!loading && error && (
            <span className="toolbar-error">{error}</span>
          )}
        </div>
      </section>

      <section className="nutri-plans__layout">
        {/* Columna izquierda: lista de planes */}
        <aside className="nutri-plans__list">
          {filteredPlans.length === 0 && !loading && (
            <div className="nutri-plans__empty">No se encontraron planes.</div>
          )}

          {filteredPlans.map((plan) => {
            const isActive = selectedPlan?._id === plan._id;
            const userName = plan.userId?.name || "Sin nombre";
            const userEmail = plan.userId?.email || "";
            const objetivo = plan.meta?.objetivo || "Sin objetivo";
            const dieta = plan.meta?.dieta || "";
            const diasCount = plan.dias?.length || 0;

            return (
              <article
                key={plan._id}
                className={`plan-card ${isActive ? "plan-card--active" : ""}`}
                onClick={() => handleSelectPlan(plan)}
              >
                <div className="plan-card__header">
                  <div className="plan-card__avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="plan-card__info">
                    <div className="plan-card__user">{userName}</div>
                    <div className="plan-card__email">{userEmail}</div>
                  </div>
                  <div className={`plan-card__status pill pill--${plan.status}`}>
                    {statusLabel(plan.status)}
                  </div>
                </div>

                <div className="plan-card__meta">
                  <div className="plan-card__line">
                    <span className="label">Objetivo:</span>
                    <span>{objetivo}</span>
                  </div>
                  {dieta && (
                    <div className="plan-card__line">
                      <span className="label">Dieta:</span>
                      <span>{dieta}</span>
                    </div>
                  )}
                  <div className="plan-card__bottom">
                    <span className="chip">
                      📅 {diasCount} {diasCount === 1 ? "día" : "días"}
                    </span>
                    <span className="chip chip--source">
                      {plan.source === "ai" ? "IA" : "Manual"}
                    </span>
                    <span className="plan-card__date">
                      Creado {formatDate(plan.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </aside>

        {/* Columna derecha: detalle del plan seleccionado */}
        <section className="nutri-plans__detail">
          {!selectedPlan && (
            <div className="plan-detail__empty">
              <p>Selecciona un plan en la lista para revisarlo.</p>
            </div>
          )}

          {selectedPlan && (
            <div className="plan-detail">
              <div className="plan-detail__header">
                <div>
                  <h2>
                    Plan de{" "}
                    <span className="highlight">
                      {selectedPlan.userId?.name || "Paciente"}
                    </span>
                  </h2>
                  <p className="muted">
                    Objetivo:{" "}
                    <strong>
                      {selectedPlan.meta?.objetivo || "Sin objetivo definido"}
                    </strong>{" "}
                    · Dieta:{" "}
                    <strong>{selectedPlan.meta?.dieta || "General"}</strong>
                  </p>
                  <p className="muted small">
                    Recomendación calórica:{" "}
                    <strong>
                      {selectedPlan.meta?.calorias_diarias_recomendadas ||
                        "—"}{" "}
                      kcal/día
                    </strong>
                    {selectedPlan.meta?.alergias?.length > 0 && (
                      <>
                        {" "}
                        · Alergias:{" "}
                        <span>
                          {selectedPlan.meta.alergias.join(", ")}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="plan-detail__actions">
                  <span className={`pill pill--${selectedPlan.status}`}>
                    {statusLabel(selectedPlan.status)}
                  </span>
                  <button
                    className="btn-primary"
                    disabled={
                      approving || selectedPlan.status === "approved"
                    }
                    onClick={() => setConfirmOpen(true)}
                  >
                    {selectedPlan.status === "approved"
                      ? "Plan aprobado"
                      : approving
                      ? "Aprobando..."
                      : "Aprobar plan y recetas"}
                  </button>
                </div>
              </div>

              <div className="plan-detail__notes">
                <label className="notes-label">
                  Notas para el paciente (opcional)
                </label>
                <textarea
                  className="notes-textarea"
                  rows={3}
                  placeholder="Comentarios o ajustes que quieras dejar registrados para este plan..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                />
              </div>

              <div className="plan-detail__days-header">
                <h3>Resumen del plan (7 días)</h3>
                <p className="muted small">
                  Haz clic en “Ver receta” para revisar y editar cada comida en
                  detalle desde el panel de recetas.
                  {recipeLoading && " Cargando receta..."}
                </p>
              </div>

              <div className="plan-detail__days-grid">
                {(selectedPlan.dias || [])
                  .slice()
                  .sort((a, b) => (a.dia || 0) - (b.dia || 0))
                  .map((day) => (
                    <article key={day.dia} className="plan-day">
                      <header className="plan-day__header">
                        <div className="plan-day__chip">Día {day.dia}</div>
                      </header>

                      <div className="plan-day__meals">
                        {(day.comidas || []).map((meal, idx) => {
                          const title =
                            meal.recetaTitle ||
                            meal.receta?.title ||
                            "Comida sin título";
                          return (
                            <div
                              key={`${day.dia}-${idx}`}
                              className="plan-meal"
                            >
                              <div className="plan-meal__top">
                                <span className="plan-meal__type">
                                  {meal.nombre}
                                </span>
                                <span className="plan-meal__kcal">
                                  {meal.calorias_aprox
                                    ? `${meal.calorias_aprox} kcal`
                                    : "kcal no definidas"}
                                </span>
                              </div>
                              <div className="plan-meal__title">{title}</div>

                              <div className="plan-meal__actions">
                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={() => handleOpenRecipe(meal)}
                                >
                                  Ver receta
                                </button>
                                {meal.recetaId && (
                                  <button
                                    type="button"
                                    className="link-button link-button--ghost"
                                    onClick={() => handleEditRecipe(meal)}
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          )}
        </section>
      </section>

      {/* Modal de receta reutilizable */}
      {recipeModalOpen && selectedRecipe && (
        <RecipeModal
          isOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
          recipe={selectedRecipe}
          mode="nutri"
        />
      )}

      {editModalOpen && editRecipe && (
        <CreateRecipeModalNutri
          token={token}
          mode="edit"
          initialRecipe={editRecipe}
          onClose={() => setEditModalOpen(false)}
          onCreated={(updated) => {
            setEditModalOpen(false);
            if (updated) {
              setSelectedRecipe(updated);
            }
            // opcional: podrías llamar a fetchPlans() aquí si quieres refrescar
          }}
        />
      )}

      {confirmOpen && selectedPlan && (
        <div className="np-modal-backdrop">
          <div className="np-modal">
            <h3>¿Aprobar este plan?</h3>
            <p>
              Se aprobará el plan de{" "}
              <strong>{selectedPlan.userId?.name || "Paciente"}</strong> y
              todas las recetas asociadas. Después de esto, el usuario podrá
              verlo en su sección de "Mi plan".
            </p>

            <div className="np-modal__actions">
              <button
                type="button"
                className="np-btn np-btn--ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={approving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="np-btn np-btn--primary"
                onClick={handleApprovePlan}
                disabled={approving}
              >
                {approving ? "Aprobando..." : "Sí, aprobar plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ TOAST INFERIOR DERECHA */}
      {toast.open && (
        <div
          className={`np-toast np-toast--${toast.type}`}
          onAnimationEnd={() => {
            // opcional: auto-cerrar por animación, o usa setTimeout en useEffect
          }}
        >
          {toast.message}
          <button
            type="button"
            className="np-toast__close"
            onClick={() => setToast((t) => ({ ...t, open: false }))}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
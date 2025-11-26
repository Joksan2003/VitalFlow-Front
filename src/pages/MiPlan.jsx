// src/pages/MiPlan.jsx
import { useState, useEffect } from "react";
import "../styles/plan.css";
import {
  generarPlan,
  obtenerMiPlan,
  obtenerRecetasBulk,
} from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import RecipeModal from "../components/RecipeModal";
import RecipeCard from "../components/RecipeCard";

export default function PlanAlimenticio() {
  const { token } = useAuth();

  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState("generar"); // "generar" | "actual" | "favoritos"
  const [loadingInitial, setLoadingInitial] = useState(true); // carga inicial del plan
  const [generating, setGenerating] = useState(false); // cuando doy clic en "Generar plan"

  const [plan, setPlan] = useState(null); // <<< FALTABA ESTO

  // mapa id -> receta normalizada (ingredients, instructions, etc.)
  const [recipeMap, setRecipeMap] = useState({});

  const [filterMeal, setFilterMeal] = useState("all"); // all | Desayuno | Almuerzo | Cena | Merienda
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [favoriteIds, setFavoriteIds] = useState([]);

  // NUEVO PARA MODAL GENERAR PLAN
  const [planErrorMsg, setPlanErrorMsg] = useState("");

  // Helpers favoritos (localStorage)
  const loadFavorites = () => {
    try {
      const raw = localStorage.getItem("vf_fav_recipes");
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const saveFavorites = (arr) => {
    try {
      localStorage.setItem("vf_fav_recipes", JSON.stringify(arr));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (token) {
      fetchPlan();
    } else {
      setPlan(null);
      setRecipeMap({});
      setLoadingInitial(false); // <<< ANTES era setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setFavoriteIds(loadFavorites());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Cargar al recipeMap las recetas favoritas que NO vienen del plan
    async function hydrateFavoriteRecipes() {
      if (!favoriteIds || favoriteIds.length === 0) return;

      // ids que ya tenemos en recipeMap
      const existingIds = new Set(Object.keys(recipeMap));

      // ids favoritos que faltan en el mapa
      const missing = favoriteIds.filter((id) => !existingIds.has(String(id)));
      if (missing.length === 0) return;

      try {
        const bulk = await obtenerRecetasBulk(missing, token);
        const recs = bulk.data || bulk.recipes || [];

        if (!Array.isArray(recs) || recs.length === 0) return;

        const newMap = { ...recipeMap };
        recs.forEach((r) => {
          if (!r || !r._id) return;
          const normalized = normalizeRecipe(r);
          newMap[String(r._id)] = normalized;
        });

        setRecipeMap(newMap);
      } catch (err) {
        console.warn("Error hidratando favoritos externos:", err);
      }
    }

    hydrateFavoriteRecipes();
  }, [favoriteIds, recipeMap, token]);

  /** Normaliza cualquier receta (de la colección recipes o embebida en el plan)
   * para que siempre tenga:
   *   - ingredients: [{ name, amount, unit, local }]
   *   - instructions: [ "..." ]
   */
  function normalizeRecipe(r) {
    if (!r) return null;

    // 1) INGREDIENTES
    const rawIngredients =
      r.ingredients ||
      r.ingredientes ||
      r.ingredientsList ||
      r.ingredientsArray ||
      [];

    const ingredients = Array.isArray(rawIngredients)
      ? rawIngredients.map((ing) => {
          if (!ing) return null;

          // Si viene como string → simple
          if (typeof ing === "string") {
            return { name: ing, amount: "", unit: "", local: false };
          }

          const name = (ing.name || ing.nombre || ing.title || "")
            .toString()
            .trim();
          const amount = (
            ing.amount ||
            ing.cantidad ||
            ing.qty ||
            ing.quantity ||
            ing.amountText ||
            ""
          )
            .toString()
            .trim();
          const unit = (ing.unit || ing.unidad || ing.u || "")
            .toString()
            .trim();
          const local = !!(ing.local || ing.isLocal || ing.localIngredient);

          return { name, amount, unit, local };
        })
      : [];

    // 2) INSTRUCCIONES / PASOS
    const rawInstructions =
      r.instructions ||
      r.steps ||
      r.pasos ||
      r.instruction ||
      r.pasos_de_preparacion ||
      r.method ||
      [];

    let instructions = [];

    if (typeof rawInstructions === "string") {
      instructions = rawInstructions
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(rawInstructions)) {
      instructions = rawInstructions
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") return item;
          return (
            item.text ||
            item.step ||
            item.instruction ||
            item.description ||
            JSON.stringify(item)
          );
        })
        .filter(Boolean);
    } else if (rawInstructions && typeof rawInstructions === "object") {
      if (Array.isArray(rawInstructions.steps)) {
        instructions = rawInstructions.steps
          .map((s) =>
            typeof s === "string"
              ? s
              : s.text || s.step || s.instruction || JSON.stringify(s)
          )
          .filter(Boolean);
      } else {
        instructions = [String(rawInstructions)];
      }
    }

    return {
      ...r,
      ingredients,
      instructions,
    };
  }

  /** Trae el plan del backend y construye el recipeMap
   * con:
   *  - recetas de /api/recipes/bulk (recetaId / suggestedRecipes)
   *  - recetas embebidas en plan.dias[*].comidas[*].receta
   */
  async function fetchPlan() {
    try {
      setLoadingInitial(true);
      const res = await obtenerMiPlan(token); // { ok, data: [...] o {plans: [...]}
      const plans = res.data || res.plans || [];

      if (!plans || plans.length === 0) {
        setPlan(null);
        setRecipeMap({});
        setActiveTab("generar");
        return;
      }

      const latest = plans[0]; // tomar el plan más reciente
      setPlan(latest);
      setActiveTab("actual");

      // 1) Recolectar IDs de recetas referenciadas
      const idsSet = new Set();

      (latest.suggestedRecipes || []).forEach((r) => {
        const id =
          typeof r === "string"
            ? r
            : r?._id || r.id || r.recipeId || r.recetaId;
        if (id) idsSet.add(String(id));
      });

      (latest.dias || []).forEach((d) => {
        (d.comidas || []).forEach((m) => {
          const ridObj = m.recetaId;
          const rid =
            typeof ridObj === "object"
              ? ridObj._id || ridObj.id || ridObj.toString?.()
              : ridObj;
          if (rid) idsSet.add(String(rid));
        });
      });

      const recipeIds = Array.from(idsSet);

      // 2) Traer recetas por bulk desde /api/recipes/bulk
      let fetchedMap = {};
      if (recipeIds.length > 0) {
        try {
          const bulk = await obtenerRecetasBulk(recipeIds, token);
          const recs = bulk.data || bulk.recipes || [];
          recs.forEach((r) => {
            const n = normalizeRecipe(r);
            if (n && r._id) {
              fetchedMap[String(r._id)] = n;
            }
          });
        } catch (err) {
          console.warn("Error trayendo recetas bulk:", err);
        }
      }

      // 3) Agregar / MERGEAR con las recetas embebidas del plan
      (latest.dias || []).forEach((d) => {
        (d.comidas || []).forEach((m) => {
          const embedded = m.receta || m.receta_embebida || m.recipe;
          if (!embedded || typeof embedded !== "object") return;

          const ridObj = m.recetaId || embedded._id || embedded.id;
          const ridStr = ridObj ? String(ridObj) : null;

          const base =
            ridStr && fetchedMap[ridStr] ? fetchedMap[ridStr] : {};

          const merged = normalizeRecipe({
            ...base,
            ...embedded,
          });

          if (ridStr) {
            fetchedMap[ridStr] = merged;
          } else {
            const key = `embedded:${latest._id}:${d.dia}:${
              m.nombre || m.recetaTitle || ""
            }`;
            fetchedMap[key] = merged;
          }
        });
      });

      setRecipeMap(fetchedMap);
    } catch (err) {
      console.error("Error fetching plan:", err);
      setPlan(null);
      setRecipeMap({});
    } finally {
      setLoadingInitial(false);
    }
  }

  async function handleGeneratePlan() {
    try {
      setGenerating(true);
      await generarPlan(token);
      await fetchPlan();
    } catch (err) {
      console.error("Error generando plan:", err);

      const msg =
        err?.response?.data?.msg ||
        "Ocurrió un error al generar tu plan. Inténtalo más tarde.";

      setPlanErrorMsg(msg); // mostramos modal bonito
    } finally {
      setGenerating(false);
    }
  }

  function handleToggleFavorite(rec) {
    if (!rec) return;
    const id = rec._id || rec.id || rec.recipeId || rec.recetaId;
    if (!id) return;
    const idStr = String(id);
    setFavoriteIds((prev) => {
      const exists = prev.includes(idStr);
      const next = exists ? prev.filter((x) => x !== idStr) : [...prev, idStr];
      saveFavorites(next);
      return next;
    });
  }

  // Render de una comida (desayuno, comida, etc.) usando RecipeCard
  function renderMeal(meal) {
    let rid = null;

    if (meal.recetaId) {
      rid =
        typeof meal.recetaId === "object"
          ? meal.recetaId._id ||
            meal.recetaId.id ||
            meal.recetaId.toString?.()
          : meal.recetaId;
    }

    let recipe = rid && recipeMap[String(rid)] ? recipeMap[String(rid)] : null;

    // fallback: si viene embebida y no la encontramos por id, intentar por title
    if (!recipe && meal.receta && typeof meal.receta === "object") {
      const titleKey = meal.receta.title || meal.recetaTitle;
      recipe =
        Object.values(recipeMap).find((r) => r.title === titleKey) ||
        normalizeRecipe(meal.receta);
    }

    const kcal =
      meal.calorias_aprox != null
        ? meal.calorias_aprox
        : recipe?.kcal != null
        ? recipe.kcal
        : null;

    const handleOpen = () => {
      if (recipe) setSelectedRecipe(recipe);
    };

    const cardRecipe = {
      ...(recipe || {}),
      _id: recipe?._id || rid || (recipe && recipe.id) || undefined,
      title:
        meal.recetaTitle ||
        recipe?.title ||
        "Receta generada para este horario",
      description:
        recipe?.description ||
        "Receta generada automáticamente para este horario.",
      kcal: kcal ?? recipe?.kcal,
      mealName: meal.nombre,
    };

    return (
      <div
        key={meal.nombre + (rid || meal.recetaTitle || Math.random())}
        className="pf-meal-wrapper"
      >
        <RecipeCard
          recipe={cardRecipe}
          onOpen={handleOpen}
          showAddButton={false}
          isFavorite={
            cardRecipe._id ? favoriteIds.includes(String(cardRecipe._id)) : false
          }
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    );
  }

  // LOADER INICIAL O DURANTE GENERACIÓN
  if (loadingInitial || generating) {
    return (
      <main className="pf-loading-wrapper">
        <div className="pf-loading-card">
          <div className="pf-loading-icon">
            <div className="pf-pan" />
            <div className="pf-steam">
              <span />
              <span />
              <span />
            </div>
          </div>
          <h2>Estamos cocinando tu plan 🍳</h2>
          <p>
            Esto puede tardar algunos segundos mientras nuesr IA elige las mejores
            recetas para ti...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Tu Plan Alimenticio</h1>
      <p className="text-gray-500 mb-6">
        Genera con IA un plan semanal y revisa las recetas creadas para cada
        día.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("generar")}
          className={`pf-pill ${activeTab === "generar" ? "active" : ""}`}
        >
          Generar Plan
        </button>
        <button
          onClick={() => setActiveTab("actual")}
          className={`pf-pill ${activeTab === "actual" ? "active" : ""}`}
          disabled={!plan}
        >
          Plan Actual
        </button>

        <button
          onClick={() => setActiveTab("favoritos")}
          className={`pf-pill ${activeTab === "favoritos" ? "active" : ""}`}
        >
          Recetas Favoritas
        </button>
      </div>

      {activeTab === "generar" && (
        <div className="vf-card">
          <p>
            Al generar un plan, la IA creará un esquema de 7 días con desayunos,
            comidas, cenas y colaciones adaptadas a tu perfil. Las recetas
            quedarán ligadas a tu cuenta para revisión del nutriólogo.
          </p>
          <div className="mt-4">
            <button
              className={`vf-btn ${generating ? "vf-btn-loading" : ""}`}
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? "Generando tu plan..." : "Generar plan con IA"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "actual" && (
        <>
          {!plan ? (
            <div className="vf-card vf-plan-empty">
              <p className="vf-muted">
                No tienes un plan activo. Genera uno con IA.
              </p>
            </div>
          ) : (
            <>
              <div className="vf-card mb-4">
                {/* Encabezado de bienvenida + fuente + estado */}
                <div className="pf-plan-header">
                  <div className="pf-plan-title">
                    <h2>
                      {plan.nombre_persona
                        ? `Hola, ${plan.nombre_persona} 👋`
                        : "Tu plan semanal"}
                    </h2>
                    <p>
                      Este es tu plan alimenticio para 7 días. Revisa tus
                      comidas, explora las recetas y sigue las
                      recomendaciones día a día.
                    </p>
                  </div>

                  <div className="pf-plan-meta">
                    <div className="pf-plan-chip">
                      <span className="pf-plan-chip-label">Fuente</span>
                      <span className="pf-plan-chip-value">
                        {((plan.source || "").toLowerCase() === "ai" ||
                          (plan.source || "").toLowerCase() === "ia")
                          ? "Generado con IA de VitalFlow"
                          : plan.source || "Definido por tu nutriólogo"}
                      </span>
                    </div>

                    <div
                      className={
                        "pf-status-pill " +
                        (plan.status === "approved"
                          ? "ok"
                          : plan.status === "pending"
                          ? "pending"
                          : "other")
                      }
                    >
                      {plan.status === "approved" &&
                        "Aprobado por tu nutriólogo"}
                      {plan.status === "pending" && "Pendiente de revisión"}
                      {plan.status !== "approved" &&
                        plan.status !== "pending" &&
                        (plan.status || "Borrador")}
                    </div>
                  </div>
                </div>

                {/* Filtro por tipo de comida + barra de búsqueda */}
                <div className="pf-filter-row">
                  <div className="pf-filter-group">
                    <label>Mostrar</label>
                    <select
                      value={filterMeal}
                      onChange={(e) => setFilterMeal(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Almuerzo">Almuerzo</option>
                      <option value="Merienda">Merienda</option>
                      <option value="Cena">Cena</option>
                    </select>
                  </div>

                  <div className="pf-filter-search">
                    <input
                      type="text"
                      placeholder="Buscar por nombre de receta..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Días del plan */}
              <section className="pf-days">
                {(plan.dias || []).map((d) => (
                  <div className="pf-day-card" key={d.dia}>
                    <h3 className="pf-day-title">Día {d.dia}</h3>
                    <div className="pf-meals-list">
                      {(d.comidas || [])
                        .filter((m) => {
                          const passesMeal =
                            filterMeal === "all"
                              ? true
                              : String(m.nombre || "")
                                  .toLowerCase()
                                  .includes(filterMeal.toLowerCase());

                          if (!passesMeal) return false;

                          if (!search.trim()) return true;

                          const q = search.toLowerCase();
                          const title = String(
                            m.recetaTitle ||
                              (m.receta && m.receta.title) ||
                              ""
                          ).toLowerCase();

                          return title.includes(q);
                        })
                        .map((meal) => renderMeal(meal))}
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {activeTab === "favoritos" && (
        <section className="pf-favorites">
          <h2 className="text-xl font-semibold mb-4">Tus recetas favoritas</h2>
          {favoriteIds.length === 0 ? (
            <div className="vf-card vf-plan-empty">
              <p className="vf-muted">
                Aún no has marcado ninguna receta como favorita. Toca el
                corazón en una receta para agregarla aquí.
              </p>
            </div>
          ) : (
            <div className="pf-favorites-grid">
              {Object.values(recipeMap)
                .filter(
                  (r) =>
                    r &&
                    r._id &&
                    favoriteIds.includes(String(r._id))
                )
                .map((r) => (
                  <div key={r._id} className="pf-meal-wrapper">
                    <RecipeCard
                      recipe={r}
                      onOpen={() => setSelectedRecipe(r)}
                      showAddButton={false}
                      isFavorite={favoriteIds.includes(String(r._id))}
                      onToggleFavorite={handleToggleFavorite}
                      addLabel=""
                    />
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {/* Modal de receta */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Modal para avisos al generar plan (ej: solo 1 cada 7 días) */}
      {planErrorMsg && (
        <div
          className="vf-modal-overlay"
          onClick={() => setPlanErrorMsg("")}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="vf-modal vf-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="vf-modal-header">
              <h3>Información sobre tu plan</h3>
              <button
                className="vf-modal-close"
                onClick={() => setPlanErrorMsg("")}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>

            <div className="vf-modal-body">
              <p>{planErrorMsg}</p>
            </div>

            <footer className="vf-modal-footer">
              <button className="vf-btn" onClick={() => setPlanErrorMsg("")}>
                Entendido
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
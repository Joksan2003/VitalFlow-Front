// src/pages/Recetas.jsx
import React, { useEffect, useState, useCallback } from "react";
import Filters from "../components/Filters";
import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";
import RecipeModalNutri from "../components/RecipeModalNutri";
import CreateRecipeModalNutri from "../components/CreateRecipeModalNutri";
import "../styles/recipes.css";
import { useAuth } from "../contexts/AuthContext";
import { obtenerMiPlan } from "../services/planService";

import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

export default function RecetasPage() {
  const { token, user } = useAuth();
  const isNutri = user?.role === "nutriologo" || user?.role === "admin";

  const [recipes, setRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    diet: "",
    maxKcal: "",
    local: false,
    sort: "",
  });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [excludedIds, setExcludedIds] = useState([]); // recetas del plan actual

  const [showCreate, setShowCreate] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null); // ← receta que se está editando

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // -------- favoritos en localStorage --------
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
    setFavoriteIds(loadFavorites());
  }, []);

  // ---------- Helper para armar query ----------
  const buildQuery = (f, p = page) => {
    const params = new URLSearchParams();
    params.set("page", p);
    params.set("limit", limit);
    if (f.q) params.set("q", f.q);
    if (f.category) params.set("category", f.category);
    if (f.diet) params.set("diet", f.diet);
    if (f.maxKcal) params.set("maxKcal", f.maxKcal);
    if (f.local) params.set("local", "true");
    if (f.sort) params.set("sort", f.sort);
    return params.toString();
  };

  // ---------- Cargar plan del usuario para saber qué recetas excluir ----------
  useEffect(() => {
    const loadPlanAndExcluded = async () => {
      if (!token) {
        setExcludedIds([]);
        return;
      }
      try {
        const res = await obtenerMiPlan(token);
        const plans = res.plans || res.data || [];

        if (!Array.isArray(plans) || plans.length === 0) {
          setExcludedIds([]);
          return;
        }

        const latestPlan = plans[0]; // asumimos sort({ createdAt: -1 }) en el backend
        const idsSet = new Set();

        if (Array.isArray(latestPlan.dias)) {
          latestPlan.dias.forEach((d) => {
            if (Array.isArray(d.comidas)) {
              d.comidas.forEach((c) => {
                const rid = c.recetaId;
                if (!rid) return;
                const idStr =
                  typeof rid === "string"
                    ? rid
                    : rid._id
                    ? String(rid._id)
                    : String(rid);
                idsSet.add(idStr);
              });
            }
          });
        }

        setExcludedIds(Array.from(idsSet));
      } catch (err) {
        console.error(
          "Error cargando plan del usuario para excluir recetas:",
          err
        );
        setExcludedIds([]);
      }
    };

    loadPlanAndExcluded();
  }, [token]);

  // ---------- Fetch de recetas + filtro por excludedIds ----------
  const fetchRecipes = useCallback(
    async (f = filters, p = 1) => {
      setLoading(true);
      setError("");
      try {
        const q = buildQuery(f, p);
        const res = await fetch(`${API}/api/recipes?${q}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.msg || "Error al cargar recetas");
        let data = json.data || [];

        // filtrar recetas que están en el plan actual
        if (excludedIds.length > 0) {
          const exclSet = new Set(excludedIds);
          data = data.filter((r) => !exclSet.has(String(r._id)));
        }

        setRecipes(data);
        setTotal(json.total ?? data.length);
        setPage(json.page || p);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error");
      } finally {
        setLoading(false);
      }
    },
    [filters, limit, excludedIds]
  );

  useEffect(() => {
    fetchRecipes(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRecipes(filters, 1), 250);
    return () => clearTimeout(t);
  }, [filters, excludedIds, fetchRecipes]);

  const clearFilters = () =>
    setFilters({
      q: "",
      category: "",
      diet: "",
      maxKcal: "",
      local: false,
      sort: "",
    });

  const activeFiltersCount = [
    filters.q,
    filters.category,
    filters.diet,
    filters.maxKcal,
    filters.local ? "local" : "",
  ].filter(Boolean).length;

  const handleToggleFavorite = (rec) => {
    if (!rec) return;
    const id = rec._id || rec.id || rec.recipeId;
    if (!id) return;
    const idStr = String(id);
    setFavoriteIds((prev) => {
      const exists = prev.includes(idStr);
      const next = exists ? prev.filter((x) => x !== idStr) : [...prev, idStr];
      saveFavorites(next);
      return next;
    });
  };

  const handleCreatedOrUpdatedRecipe = () => {
    // se llama después de crear/editar receta en el modal
    fetchRecipes(filters, 1);
    setShowCreate(false);
    setEditingRecipe(null);
  };

  // --------- handlers para los 3 puntos (nutriólogo) ---------
  const handleEditRecipe = (recipe) => {
    if (!isNutri) return;
    setEditingRecipe(recipe);
    setShowCreate(true);
  };

  // abrir modal de confirmación
const askDeleteRecipe = (recipe) => {
  if (!isNutri) return;
  setDeleteTarget(recipe);
  setDeleteError("");
};

// confirmar eliminación (se llama desde el modal)
const handleConfirmDelete = async () => {
  if (!deleteTarget) return;
  if (!token) {
    setDeleteError("Necesitas estar autenticado para eliminar recetas");
    return;
  }

  try {
    setDeleteLoading(true);
    setDeleteError("");

    const res = await fetch(`${API}/api/recipes/${deleteTarget._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.msg || "No se pudo eliminar");

    // recargar listado
    await fetchRecipes(filters, 1);

    // cerrar modal
    setDeleteTarget(null);
    setDeleteLoading(false);
  } catch (err) {
    console.error(err);
    setDeleteError(err.message || "Error al eliminar la receta");
    setDeleteLoading(false);
  }
};

const handleCancelDelete = () => {
  if (deleteLoading) return;
  setDeleteTarget(null);
  setDeleteError("");
};

  return (
    <main className="recipes-page">
      <header className="recipes-header">
        <h1>Catálogo de Recetas</h1>
        <p className="sub">
          Descubre recetas deliciosas y saludables adaptadas a tus necesidades
        </p>
      </header>

      <section className="filters-wrapper">
        <Filters filters={filters} onChange={setFilters} />
        <div className="actions">
          <button
            className="btn-clear"
            onClick={clearFilters}
            disabled={activeFiltersCount === 0}
          >
            Limpiar {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
          </button>
        </div>
      </section>

      <section className="recipes-list">
        {loading ? (
          <div className="loader">Cargando...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="found">
              {total} receta{total === 1 ? "" : "s"} encontradas
            </div>
            <div className="grid">
              {recipes.map((r) => (
                  <RecipeCard
                    key={r._id}
                    recipe={r}
                    onOpen={() => setSelected(r)}
                    isFavorite={favoriteIds.includes(String(r._id))}
                    onToggleFavorite={handleToggleFavorite}
                    // menú de 3 puntos SOLO nutriólogo/admin
                    isNutri={isNutri}
                    onEdit={isNutri ? () => handleEditRecipe(r) : undefined}
                    onDelete={isNutri ? () => askDeleteRecipe(r) : undefined}   // 👈 AQUÍ
                  />
                ))}
            </div>
          </>
        )}
      </section>

      {/* Botón flotante solo para nutriólogo/admin */}
      {isNutri && (
        <button
          className="recipes-fab"
          type="button"
          onClick={() => {
            setEditingRecipe(null); // modo crear
            setShowCreate(true);
          }}
        >
          +
        </button>
      )}

      {/* Modal de detalle de receta */}
      {selected &&
        (isNutri ? (
          <RecipeModalNutri
            recipe={selected}
            onClose={() => setSelected(null)}
          />
        ) : (
          <RecipeModal recipe={selected} onClose={() => setSelected(null)} />
        ))}

      {/* Modal para CREAR / EDITAR receta (solo nutriólogo/admin) */}
      {isNutri && showCreate && (
        <CreateRecipeModalNutri
          token={token}
          initialRecipe={editingRecipe} // null -> crear, objeto -> editar
          mode={editingRecipe ? "edit" : "create"}
          onClose={() => {
            setShowCreate(false);
            setEditingRecipe(null);
          }}
          onCreated={handleCreatedOrUpdatedRecipe}
        />
      )}

      {isNutri && (
        <ConfirmDeleteModal
          open={!!deleteTarget}
          recipe={deleteTarget}
          loading={deleteLoading}
          error={deleteError}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
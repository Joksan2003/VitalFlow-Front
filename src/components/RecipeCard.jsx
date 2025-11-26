// src/components/RecipeCard.jsx
import React, { useState, useEffect, useRef } from "react";

export default function RecipeCard({
  recipe,
  onOpen,
  onAdd,
  showAddButton = true,
  addLabel = "Agregar al Plan",
  isFavorite = false,
  onToggleFavorite,
  // NUEVO: solo nutriólogo/admin ve el menú de 3 puntos
  isNutri = false,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const img = recipe.imageUrl || "/placeholder_recipe.png";

  const favoritesCount =
    typeof recipe.favoriteCount === "number"
      ? recipe.favoriteCount
      : typeof recipe.favoritesCount === "number"
      ? recipe.favoritesCount
      : recipe.likes || 0; // fallbacks por si hay campos viejos

  const handleClick = () => {
    if (onOpen) onOpen(recipe);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(recipe);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (onAdd) onAdd(recipe);
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onEdit) onEdit(recipe);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) onDelete(recipe);
  };

  const diets = Array.isArray(recipe.diets) ? recipe.diets : [];
  const categories = Array.isArray(recipe.categories) ? recipe.categories : [];
  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  return (
    <article
      className="recipe-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Imagen / encabezado */}
      <div className="card-media">
        <img src={img} alt={recipe.title} />
        {recipe.local && <span className="badge local">Local</span>}

        {recipe.mealName && (
          <span className="badge meal">{recipe.mealName}</span>
        )}

        {/* Corazón de favoritos */}
        <button
          type="button"
          className={`fav-btn ${isFavorite ? "active" : ""}`}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? "♥" : "♡"} {favoritesCount}
        </button>
      </div>

      {/* Contenido */}
      <div className="card-body">
        {/* Menú de 3 puntos (solo nutriólogo/admin) */}
        {isNutri && (onEdit || onDelete) && (
          <div
            className="card-menu"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="card-menu-btn"
              onClick={handleToggleMenu}
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="card-menu-dropdown">
                {onEdit && (
                  <button type="button" onClick={handleEdit}>
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="danger"
                    onClick={handleDelete}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Título truncado */}
        <h3 className="card-title" title={recipe.title}>
          {recipe.title}
        </h3>

        {/* Descripción con altura uniforme */}
        <p className="desc">{recipe.description}</p>

        {/* Meta: tiempo, porciones, kcal */}
        <div className="meta">
          {recipe.durationMin != null && (
            <span>⏱ {recipe.durationMin} min</span>
          )}
          {recipe.servings != null && <span>👥 {recipe.servings} pers.</span>}
          {recipe.kcal != null && (
            <span className="kcal">{recipe.kcal} kcal</span>
          )}
        </div>

        {/* Chips: dietas, categorías, tags */}
        <div className="chips">
          {diets.slice(0, 2).map((d) => (
            <span key={`diet-${d}`} className="chip diet">
              {d}
            </span>
          ))}
          {categories.slice(0, 2).map((c) => (
            <span key={`cat-${c}`} className="chip">
              {c}
            </span>
          ))}
          {tags.slice(0, 2).map((t) => (
            <span key={`tag-${t}`} className="chip tag">
              {t}
            </span>
          ))}
          {recipe.status && (
            <span
              className={`chip status ${
                recipe.status === "approved" ? "ok" : "pending"
              }`}
            >
              {recipe.status === "approved" ? "Aprobada" : recipe.status}
            </span>
          )}
        </div>

        {/* Botón de acción (opc) */}
        {/* {showAddButton && (
          <div className="card-actions">
            <button className="btn-outline" onClick={handleAdd}>
              {addLabel}
            </button>
          </div>
        )} */}
      </div>
    </article>
  );
}

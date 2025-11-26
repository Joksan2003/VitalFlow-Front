// src/components/RecipeModalNutri.jsx
import React, { useEffect } from "react";
import "../styles/recipeModalNutri.css";

export default function RecipeModalNutri({ recipe, onClose }) {
  if (!recipe) return null;

  useEffect(() => {
    document.body.classList.add("vf-modal-open");
    return () => document.body.classList.remove("vf-modal-open");
  }, []);

  const {
    title,
    description,
    imageUrl,
    kcal,
    servings,
    durationMin,
    prepTimeMin,
    categories = [],
    diets = [],
    tags = [],
    status,
    local,
    ingredients = [],
    steps,
    instructions,
    createdByUser,
    createdAt,
  } = recipe;

  const timeMinutes =
    prepTimeMin != null && prepTimeMin !== ""
      ? prepTimeMin
      : durationMin != null && durationMin !== ""
      ? durationMin
      : null;

  // normalizar pasos
  let stepsArray = [];
  if (Array.isArray(steps) && steps.length > 0) {
    stepsArray = steps.filter(Boolean);
  } else if (typeof instructions === "string" && instructions.trim()) {
    const plain = instructions.replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (plain) stepsArray = plain.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }

  const creatorName =
    createdByUser?.name ||
    createdByUser?.fullName ||
    createdByUser?.email ||
    "Nutriólogo";

  const createdDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="rm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>
        <button className="rm-close" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>

        <div className="rm-grid">
          {/* Lado izquierdo: imagen */}
          <div className="rm-media">
            {imageUrl ? (
              <img src={imageUrl} alt={title} />
            ) : (
              <div className="rm-placeholder">Sin imagen</div>
            )}
          </div>

          {/* Lado derecho: contenido */}
          <div className="rm-body">
            <div className="rm-header-line">
              <div>
                <h2 className="rm-title">{title}</h2>
                {status === "approved" && (
                  <span className="rm-status-badge ok">Aprobada</span>
                )}
                {status === "pending" && (
                  <span className="rm-status-badge pending">Pendiente</span>
                )}
                {status && !["approved", "pending"].includes(status) && (
                  <span className="rm-status-badge other">{status}</span>
                )}
              </div>
            </div>

            {description && <p className="rm-desc">{description}</p>}

            <div className="rm-meta">
              {timeMinutes != null && <span className="rm-meta-item">{timeMinutes} min</span>}
              {servings != null && <span className="rm-meta-item">{servings} porciones</span>}
              {kcal != null && <span className="rm-meta-item">{kcal} kcal</span>}
              {local && <span className="rm-meta-item">Ingredientes locales</span>}
            </div>

            <div className="rm-tags">
              {categories.length > 0 && (
                <span className="rm-tag">📂 {categories.join(", ")}</span>
              )}
              {diets.length > 0 && <span className="rm-tag">🥗 {diets.join(", ")}</span>}
              {tags.length > 0 && <span className="rm-tag">🏷 {tags.join(", ")}</span>}
            </div>

            {/* INGREDIENTES */}
            <div className="rm-section">
              <h4>Ingredientes</h4>
              {!ingredients || ingredients.length === 0 ? (
                <p className="rm-muted">No hay ingredientes listados.</p>
              ) : (
                <ul className="rm-ingredients">
                  {ingredients.map((ing, i) => {
                    const name = ing.name || ing.ingredient || "";
                    const amount = ing.amount || ing.quantity || "";
                    const unit = ing.unit || "";
                    const prefix =
                      amount || unit ? `${amount}${unit ? " " + unit : ""}` : "";
                    return (
                      <li key={i}>
                        {prefix && <span className="rm-ing-amount">{prefix}</span>}
                        <span className="rm-ing-name">{name}</span>
                        {ing.local && <small className="rm-local">• local</small>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* PREPARACIÓN */}
            <div className="rm-section">
              <h4>Preparación</h4>
              {stepsArray.length === 0 && !instructions && (
                <p className="rm-muted">No hay pasos listados.</p>
              )}
              {stepsArray.length > 0 && (
                <ol className="rm-pasos rm-pasos-scroll">
                  {stepsArray.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
              {stepsArray.length === 0 &&
                typeof instructions === "string" &&
                instructions.trim() && (
                  <div
                    className="rm-pasos-html rm-pasos-scroll"
                    dangerouslySetInnerHTML={{ __html: instructions }}
                  />
                )}
            </div>

            {/* FOOTER */}
            <div className="rm-footer">
              <div className="rm-author">
                Creado por: <span className="rm-author-name">{creatorName}</span>
                {createdDate && <span className="rm-author-date"> · {createdDate}</span>}
              </div>
              <div className="rm-actions">
                <button className="rm-btn-outline" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

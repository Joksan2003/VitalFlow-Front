// src/components/RecipeModal.jsx
import React, { useEffect } from "react";
import "../styles/recipeModalNutri.css";

export default function RecipeModalNutri({ recipe, onClose }) {
  if (!recipe) return null;

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.classList.add("vf-modal-open");
    return () => {
      document.body.classList.remove("vf-modal-open");
    };
  }, []);

  const {
    title,
    imageUrl,
    description,
    kcal,
    durationMin,
    servings,
    diets = [],
    tags = [],
    categories = [],
    status,
    local,
    ingredients = [],
    steps,
    instructions,
    createdByUser,
    createdAt,
    mealType, // opcional: 'desayuno', 'comida', etc.
  } = recipe;

  // Normalizar pasos
  let stepsArray = [];
  if (Array.isArray(steps) && steps.length > 0) {
    stepsArray = steps;
  } else if (typeof instructions === "string" && instructions.trim()) {
    // Si viene como HTML, mejor lo mostramos tal cual con dangerouslySetInnerHTML
    const plain = instructions.replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (plain) {
      stepsArray = plain.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    }
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
    <div className="vf-modal-backdrop" onClick={onClose}>
      <div
        className="vf-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="vf-modal-header">
          <div>
            <h2 className="vf-modal-title">{title}</h2>
            {description && (
              <p className="vf-modal-sub">{description}</p>
            )}
            <div className="vf-modal-chips-row">
              {mealType && (
                <span className="chip small chip-meal">
                  {mealType}
                </span>
              )}
              {local && (
                <span className="chip small chip-local">
                  Ingredientes locales
                </span>
              )}
              {status === "approved" && (
                <span className="chip small chip-status-ok">
                  Aprobada por nutriólogo
                </span>
              )}
              {status === "pending" && (
                <span className="chip small chip-status-pending">
                  Pendiente de revisión
                </span>
              )}
            </div>
          </div>

          <button className="vf-modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Contenido principal */}
        <div className="vf-modal-body">
          {/* Columna izquierda: imagen + resumen */}
          <section className="vf-modal-left">
            <div className="vf-modal-image-wrapper">
              {imageUrl ? (
                <img src={imageUrl} alt={title} />
              ) : (
                <div className="vf-modal-image-placeholder">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="vf-modal-meta-cards">
              <div className="vf-meta-card">
                <div className="vf-meta-label">Tiempo</div>
                <div className="vf-meta-value">
                  {durationMin ? `${durationMin} min` : "—"}
                </div>
              </div>
              <div className="vf-meta-card">
                <div className="vf-meta-label">Porciones</div>
                <div className="vf-meta-value">
                  {servings || "—"}
                </div>
              </div>
              <div className="vf-meta-card">
                <div className="vf-meta-label">Calorías</div>
                <div className="vf-meta-value kcal">
                  {kcal ? `${kcal} kcal` : "—"}
                </div>
              </div>
            </div>

            <div className="vf-modal-tags-block">
              {diets.length > 0 && (
                <div className="vf-tags-row">
                  <span className="vf-tags-label">Dietas:</span>
                  <div className="vf-tags-chips">
                    {diets.map((d) => (
                      <span key={d} className="chip small">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {categories.length > 0 && (
                <div className="vf-tags-row">
                  <span className="vf-tags-label">Categorías:</span>
                  <div className="vf-tags-chips">
                    {categories.map((c) => (
                      <span key={c} className="chip small">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tags.length > 0 && (
                <div className="vf-tags-row">
                  <span className="vf-tags-label">Etiquetas:</span>
                  <div className="vf-tags-chips">
                    {tags.map((t) => (
                      <span key={t} className="chip small chip-soft">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="vf-modal-footer-meta">
              <span className="vf-meta-author">
                Creado por <strong>{creatorName}</strong>
              </span>
              {createdDate && (
                <span className="vf-meta-date">
                  {createdDate}
                </span>
              )}
            </div>
          </section>

          {/* Columna derecha: ingredientes + pasos */}
          <section className="vf-modal-right">
            <div className="vf-block">
              <h3>Ingredientes</h3>
              {(!ingredients || ingredients.length === 0) && (
                <p className="vf-muted">
                  Esta receta no tiene ingredientes detallados.
                </p>
              )}
              {ingredients && ingredients.length > 0 && (
                <ul className="vf-ingredients-list">
                  {ingredients.map((ing, idx) => {
                    const name = ing.name || ing.ingredient || "";
                    const amount = ing.amount || ing.quantity || "";
                    const unit = ing.unit || "";
                    const prefix =
                      amount || unit
                        ? `${amount}${unit ? " " + unit : ""} `
                        : "";
                    return (
                      <li key={idx}>
                        <span className="qty">
                          {prefix && <>{prefix}</>}
                        </span>
                        <span className="name">{name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="vf-block vf-steps-block">
              <h3>Pasos</h3>
              {stepsArray.length === 0 && !instructions && (
                <p className="vf-muted">
                  No se han definido pasos detallados para esta receta.
                </p>
              )}

              {stepsArray.length > 0 && (
                <ol className="vf-steps-list">
                  {stepsArray.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}

              {stepsArray.length === 0 &&
                typeof instructions === "string" &&
                instructions.trim() && (
                  <div
                    className="vf-steps-html"
                    dangerouslySetInnerHTML={{ __html: instructions }}
                  />
                )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
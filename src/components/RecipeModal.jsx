// src/components/RecipeModal.jsx
import React, { useEffect } from "react";
import "../styles/recipeModal.css";

export default function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, []);

  const {
    title,
    description,
    imageUrl,
    kcal,
    servings,
    durationMin,
    categories = [],
    diets = [],
    tags = [],
    likes,
    status,
    source,
    createdBy,
    createdAt,
  } = recipe;

  // ---------- INGREDIENTES ----------
  function indOrEmpty(v) {
    return v == null ? "" : v;
  }

  const rawIngredients =
    recipe.ingredients ||
    recipe.ingredientes ||
    recipe.ingredientsArray ||
    [];

  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
        .map((ing) => {
          if (!ing) return null;

          if (typeof ing === "string") {
            return {
              name: ing,
              amount: "",
              unit: "",
              local: false,
            };
          }

          const name = (ing.name || ing.nombre || "").toString().trim();
          const amount = (
            ing.amount ||
            ing.cantidad ||
            ing.qty ||
            ing.quantity ||
            ""
          )
            .toString()
            .trim();
          const unit = indOrEmpty(ing.unit || ing.unidad || ing.u)
            .toString()
            .trim();
          const local = !!(ing.local || ing.isLocal || ing.localIngredient);

          if (!name && !amount && !unit) return null;
          return { name, amount, unit, local };
        })
        .filter(Boolean)
    : [];

  // ---------- INSTRUCCIONES / PASOS ----------
  const rawInstructions =
    recipe.instructions ||
    recipe.pasos ||
    recipe.steps ||
    recipe.instruction ||
    recipe.pasos_de_preparacion ||
    recipe.method ||
    "";

  let instructionsArray = [];
  let instructionsHtml = "";

  if (Array.isArray(rawInstructions)) {
    instructionsArray = rawInstructions
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
  } else if (typeof rawInstructions === "string") {
    const text = rawInstructions.trim();
    if (!text) {
      instructionsArray = [];
    } else if (/<[a-z][\s\S]*>/i.test(text)) {
      instructionsHtml = text;
    } else {
      instructionsArray = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else if (rawInstructions && typeof rawInstructions === "object") {
    if (Array.isArray(rawInstructions.steps)) {
      instructionsArray = rawInstructions.steps
        .map((s) =>
          typeof s === "string"
            ? s
            : s.text || s.step || s.instruction || JSON.stringify(s)
        )
        .filter(Boolean);
    }
  }

  const hasInstructions =
    instructionsHtml ||
    (Array.isArray(instructionsArray) && instructionsArray.length > 0);

  // ---------- ESTADO / BADGE ----------
  let statusLabel = "";
  let statusClass = "";
  if (status === "approved") {
    statusLabel = "Aprobada por nutriólogo";
    statusClass = "ok";
  } else if (status === "draft") {
    statusLabel = "En revisión";
    statusClass = "pending";
  } else if (status) {
    statusLabel = status;
    statusClass = "other";
  }

  // ---------- AUTOR (evitar mostrar el _id) ----------
  const creatorDisplay =
    recipe.authorName ||
    createdBy?.name ||
    createdBy?.fullName ||
    createdBy?.email ||
    "VitalFlow";

  return (
    <div
      className="rm-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
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

          {/* Lado derecho: contenido (scroll interno) */}
          <div className="rm-body">
            <div className="rm-header-line">
              <div>
                <h2 className="rm-title">{title}</h2>
                {statusLabel && (
                  <span className={`rm-status-badge ${statusClass}`}>
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>

            {description && <p className="rm-desc">{description}</p>}

            <div className="rm-meta">
              {kcal != null && (
                <span className="rm-meta-item">{kcal} kcal</span>
              )}
              {servings != null && (
                <span className="rm-meta-item">{servings} porciones</span>
              )}
              {durationMin != null && (
                <span className="rm-meta-item">{durationMin} min</span>
              )}
              {likes != null && (
                <span className="rm-meta-item">❤ {likes}</span>
              )}
              {source && (
                <span className="rm-meta-item">
                  Fuente: {source === "ai" ? "IA" : source}
                </span>
              )}
            </div>

            <div className="rm-tags">
              {categories.length > 0 && (
                <span className="rm-tag">📂 {categories.join(", ")}</span>
              )}
              {diets.length > 0 && (
                <span className="rm-tag">🥗 {diets.join(", ")}</span>
              )}
              {tags.length > 0 && (
                <span className="rm-tag">🏷 {tags.join(", ")}</span>
              )}
            </div>

            {/* INGREDIENTES */}
            <div className="rm-section">
              <h4>Ingredientes</h4>
              {!ingredients || ingredients.length === 0 ? (
                <p className="rm-muted">No hay ingredientes listados.</p>
              ) : (
                <ul className="rm-ingredients">
                  {ingredients.map((ing, i) => {
                    if (!ing) return null;
                    if (typeof ing === "string") {
                      return <li key={i}>{ing}</li>;
                    }

                    const name = ing.name || ing.nombre || "";
                    const amountText = ing.amount
                      ? `${ing.amount}${ing.unit ? " " + ing.unit : ""}`
                      : "";

                    return (
                      <li key={i}>
                        {amountText && (
                          <span className="rm-ing-amount">{amountText}</span>
                        )}
                        <span className="rm-ing-name">{name}</span>
                        {ing.local && (
                          <small className="rm-local">• local</small>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* PREPARACIÓN (con scroll si hay muchos pasos) */}
            <div className="rm-section">
              <h4>Preparación</h4>
              {!hasInstructions ? (
                <p className="rm-muted">No hay pasos listados.</p>
              ) : instructionsHtml ? (
                <div
                  className="rm-pasos-html rm-pasos-scroll"
                  dangerouslySetInnerHTML={{ __html: instructionsHtml }}
                />
              ) : (
                <ol className="rm-pasos rm-pasos-scroll">
                  {instructionsArray.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
            </div>

            {/* FOOTER */}
            <div className="rm-footer">
              <div className="rm-author">
                Creado por:{" "}
                <span className="rm-author-name">{creatorDisplay}</span>
                {createdAt && (
                  <span className="rm-author-date">
                    {" "}
                    · {new Date(createdAt).toLocaleDateString()}
                  </span>
                )}
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
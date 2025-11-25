import React, { useState } from "react";
import "../styles/plan.css";

export default function PlanActual({ plan }) {
  const [openRecipe, setOpenRecipe] = useState(null); // receta completa a mostrar en modal

  if (!plan)
    return (
      <div className="vf-plan-empty">
        <div className="vf-card">
          <p className="vf-muted">No tienes un plan generado.</p>
          <p className="vf-muted--sm">Ve a la pestaña “Generar Plan” para crear tu plan alimenticio.</p>
        </div>
      </div>
    );

  const handleOpen = (receta) => setOpenRecipe(receta);
  const handleClose = () => setOpenRecipe(null);

  return (
    <section className="vf-plan-container">
      <div className="vf-card">
        <h2 className="vf-plan-title">Tu Plan Semanal</h2>

        {plan.dias.map((dia) => (
          <div key={dia.dia} className="vf-day">
            <h3 className="vf-day-title">Día {dia.dia}</h3>

            <div className="vf-meals-grid">
              {dia.comidas.map((meal, idx) => {
                // meal puede tener: nombre, calorias_aprox, recetaId, receta (obj)
                const rec = meal.receta || meal.recetaObj || null; // soportar distintas formas
                return (
                  <article key={idx} className="vf-meal-card">
                    <div className="vf-meal-head">
                      <div className="vf-meal-name">{meal.nombre}</div>
                      <div className="vf-meal-kcal">{meal.calorias_aprox ? `${meal.calorias_aprox} kcal` : ""}</div>
                    </div>

                    {rec ? (
                      <div className="vf-recipe-preview">
                        <div className="vf-recipe-meta">
                          <div className="vf-recipe-title">{rec.title || rec.name || rec.titulo || 'Receta IA'}</div>
                          <div className={`vf-badge ${rec.status && rec.status !== 'approved' ? 'vf-badge--warn' : 'vf-badge--ok'}`}>
                            {rec.status && rec.status !== 'approved' ? 'En revisión' : 'Aprobada'}
                          </div>
                        </div>

                        <p className="vf-recipe-summary">{rec.summary || rec.description || (rec.steps ? rec.steps.slice(0,2).join(' — ') : '')}</p>

                        <div className="vf-meal-actions">
                          <button className="vf-btn" onClick={() => handleOpen(rec)}>Ver receta</button>
                          {/* podrías agregar Guardar, Marcar como favorita, etc */}
                        </div>
                      </div>
                    ) : (
                      <div className="vf-recipe-pending">
                        <p className="vf-muted">Receta generada por IA — pendiente de revisión por nutriólogo.</p>
                        <div className="vf-meal-actions">
                          <button className="vf-btn-outline" onClick={() => alert('Próximamente podrás ver más detalles de la receta generada.')}>Ver detalles</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal simple para mostrar receta */}
      {openRecipe && (
        <div className="vf-modal-overlay" role="dialog" aria-modal="true" onClick={handleClose}>
          <div className="vf-modal" onClick={(e) => e.stopPropagation()}>
            <header className="vf-modal-header">
              <h3>{openRecipe.title || openRecipe.name || 'Receta'}</h3>
              <button className="vf-modal-close" onClick={handleClose} aria-label="Cerrar">✕</button>
            </header>

            <div className="vf-modal-body">
              {openRecipe.imageUrl && (
                <img src={openRecipe.imageUrl} alt={openRecipe.title} className="vf-modal-image" />
              )}

              <p className="vf-modal-summary">{openRecipe.summary || openRecipe.description}</p>

              {openRecipe.ingredients && openRecipe.ingredients.length > 0 && (
                <div className="vf-section">
                  <h4>Ingredientes</h4>
                  <ul>
                    {openRecipe.ingredients.map((ing, i) => (
                      <li key={i}>{ing.quantity ? `${ing.quantity} ${ing.unit || ''} ` : ''}{ing.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {openRecipe.steps && openRecipe.steps.length > 0 && (
                <div className="vf-section">
                  <h4>Preparación</h4>
                  <ol>
                    {openRecipe.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="vf-recipe-footer">
                <small>Estado: {openRecipe.status || 'draft'}</small>
                <div className="vf-recipe-meta-row">
                  {openRecipe.kcal && <span>{openRecipe.kcal} kcal</span>}
                  {openRecipe.prepTimeMin && <span> • {openRecipe.prepTimeMin} min</span>}
                </div>
              </div>
            </div>

            <footer className="vf-modal-footer">
              <button className="vf-btn-outline" onClick={handleClose}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
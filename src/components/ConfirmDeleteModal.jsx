// src/components/ConfirmDeleteModal.jsx
import React, { useEffect } from "react";

export default function ConfirmDeleteModal({
  open,
  recipe,
  loading = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  // calculamos si realmente debe mostrarse
  const isOpen = !!open && !!recipe;

  // Bloquear / restaurar scroll de fondo según isOpen
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("vf-modal-open");
    return () => {
      document.body.classList.remove("vf-modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-backdrop"
      onClick={() => {
        if (!loading && onCancel) onCancel();
      }}
    >
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()} // evitar cerrar al hacer click dentro
      >
        <h2>Eliminar receta</h2>
        <p>
          ¿Seguro que deseas eliminar la receta{" "}
          <strong>{recipe.title}</strong>? Esta acción no se puede deshacer.
        </p>

        {error && <p className="confirm-error">{error}</p>}

        <div className="confirm-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
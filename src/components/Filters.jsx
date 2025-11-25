import React, { useEffect, useState } from "react";

/**
 * Si más adelante quieres cargar categorías/diets desde API,
 * reemplaza las opciones estáticas por fetch a /api/recipes/filters
 */

export default function Filters({ filters, onChange }) {
  const [local, setLocal] = useState(Boolean(filters.local));

  useEffect(() => { setLocal(Boolean(filters.local)); }, [filters.local]);

  const handle = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <div className="vf-filters" role="search" aria-label="Filtros de recetas">
      <input
        type="search"
        placeholder="Buscar recetas, ingredientes..."
        value={filters.q}
        onChange={(e) => handle("q", e.target.value)}
        aria-label="Buscar recetas"
      />

      <select value={filters.category} onChange={(e) => handle("category", e.target.value)} aria-label="Categoría">
        <option value="">Todas las categorías</option>
        <option value="Ensaladas">Ensaladas</option>
        <option value="Pescados">Pescados</option>
        <option value="Desayunos">Desayunos</option>
      </select>

      <select value={filters.diet} onChange={(e) => handle("diet", e.target.value)} aria-label="Dieta">
        <option value="">Todas las dietas</option>
        <option value="vegetariana">Vegetariana</option>
        <option value="vegana">Vegana</option>
        <option value="omnivora">Omnívora</option>
        <option value="cetogenica">Cetogénica</option>
      </select>

      <input
        type="number"
        min="0"
        placeholder="Máx. calorías"
        value={filters.maxKcal}
        onChange={(e) => handle("maxKcal", e.target.value)}
        aria-label="Máximo calorías"
      />

      <label className="local-toggle" title="Mostrar solo recetas locales">
        <input
          type="checkbox"
          checked={local}
          onChange={(e) => { setLocal(e.target.checked); handle("local", e.target.checked); }}
        />
        Local
      </label>
    </div>
  );
}
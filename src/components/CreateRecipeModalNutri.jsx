// src/components/CreateRecipeModalNutri.jsx
import React, { useState, useEffect } from "react";
import "../styles/createRecipeModalNutri.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

export default function CreateRecipeModalNutri({
  token,
  onClose,
  onCreated,
  initialRecipe = null,
  mode = "create", // "create" | "edit"
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [kcal, setKcal] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [servings, setServings] = useState("");

  // --- Chips: dietas, categorías, etiquetas ---
  const [diets, setDiets] = useState([]);
  const [dietInput, setDietInput] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // --- Ingredientes ---
  const [ingredients, setIngredients] = useState([]);
  const [ingAmount, setIngAmount] = useState("");
  const [ingUnit, setIngUnit] = useState("");
  const [ingName, setIngName] = useState("");

  // --- Pasos ---
  const [steps, setSteps] = useState([""]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!token) return null;

  // bloquear scroll de fondo mientras el modal está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  // ================== PREFILL CUANDO EDITAS ==================
  useEffect(() => {
    if (!initialRecipe) {
      // modo crear -> limpiar
      setTitle("");
      setDescription("");
      setImageUrl("");
      setKcal("");
      setDurationMin("");
      setServings("");
      setDiets([]);
      setCategories([]);
      setTags([]);
      setIngredients([]);
      setSteps([""]);
      return;
    }

    // Modo editar -> rellenar con datos existentes
    setTitle(initialRecipe.title || "");
    setDescription(initialRecipe.description || "");
    setImageUrl(initialRecipe.imageUrl || "");
    setKcal(
      initialRecipe.kcal != null && initialRecipe.kcal !== ""
        ? String(initialRecipe.kcal)
        : ""
    );
    // Usamos prepTimeMin como campo principal; si no existe, caemos a durationMin
    const dur =
      initialRecipe.prepTimeMin != null
        ? initialRecipe.prepTimeMin
        : initialRecipe.durationMin;

    setDurationMin(
      dur != null && dur !== ""
        ? String(dur)
        : ""
    );
    setServings(
      initialRecipe.servings != null && initialRecipe.servings !== ""
        ? String(initialRecipe.servings)
        : ""
    );

    setDiets(Array.isArray(initialRecipe.diets) ? initialRecipe.diets : []);
    setCategories(
      Array.isArray(initialRecipe.categories) ? initialRecipe.categories : []
    );
    setTags(Array.isArray(initialRecipe.tags) ? initialRecipe.tags : []);

    // ingredientes: puede venir con quantity o amount según el origen
    const ingFromRecipe = Array.isArray(initialRecipe.ingredients)
      ? initialRecipe.ingredients.map((ing) => ({
          name: ing.name || "",
          quantity:
            ing.quantity != null && ing.quantity !== ""
              ? ing.quantity
              : ing.amount != null && ing.amount !== ""
              ? ing.amount
              : "",
          unit: ing.unit || "",
        }))
      : [];
    setIngredients(ingFromRecipe);

    // pasos: intentamos steps[] y si no, instructions string
    let stepsArr = [];
    if (Array.isArray(initialRecipe.steps) && initialRecipe.steps.length > 0) {
      stepsArr = initialRecipe.steps;
    } else if (
      typeof initialRecipe.instructions === "string" &&
      initialRecipe.instructions.trim() !== ""
    ) {
      stepsArr = initialRecipe.instructions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    setSteps(stepsArr.length > 0 ? stepsArr : [""]);
  }, [initialRecipe]);

  // --------- helpers chips ----------
  const addChip = (value, list, setList, setInput) => {
    const v = value.trim();
    if (!v) return;
    if (!list.includes(v)) {
      setList([...list, v]);
    }
    setInput("");
  };

  const removeChip = (value, list, setList) => {
    setList(list.filter((item) => item !== value));
  };

  const handleDietKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(dietInput, diets, setDiets, setDietInput);
    }
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(categoryInput, categories, setCategories, setCategoryInput);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(tagInput, tags, setTags, setTagInput);
    }
  };

  // --------- ingredientes ----------
  const handleAddIngredient = () => {
    const name = ingName.trim();
    if (!name) return;

    const quantity =
      ingAmount && !Number.isNaN(Number(ingAmount))
        ? Number(ingAmount)
        : ingAmount.trim() || ""; // deja string si no es número

    const newIng = {
      name,
      quantity, // coincide con tu modelo (quantity, unit, name)
      unit: ingUnit.trim(),
    };

    setIngredients([...ingredients, newIng]);

    // limpiar campos
    setIngAmount("");
    setIngUnit("");
    setIngName("");
  };

  const handleRemoveIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // --------- pasos ----------
  const handleStepChange = (idx, value) => {
    const next = [...steps];
    next[idx] = value;
    setSteps(next);
  };

  const handleAddStep = () => {
    setSteps([...steps, ""]);
  };

  const handleRemoveStep = (idx) => {
    if (steps.length === 1) {
      setSteps([""]);
      return;
    }
    setSteps(steps.filter((_, i) => i !== idx));
  };

  // ================== SUBMIT (CREATE / EDIT) ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

      const body = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        kcal: kcal ? Number(kcal) : undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        servings: servings ? Number(servings) : undefined,
        diets,
        categories,
        tags,
        ingredients,
        instructions: cleanSteps.join("\n"),
        steps: cleanSteps,
        source: "human",
        // si estás editando, normalmente quieres conservar el status actual
        status: initialRecipe?.status || "draft",
      };

      const isEdit =
        mode === "edit" && initialRecipe && initialRecipe._id != null;

      const url = isEdit
        ? `${API}/api/recipes/${initialRecipe._id}`
        : `${API}/api/recipes`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.msg || "Error al guardar receta");
      }

      if (onCreated) onCreated(json.data || json.recipe || null);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  const isEditMode = mode === "edit" && initialRecipe;

  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="crm-card" onClick={(e) => e.stopPropagation()}>
        <header className="crm-header">
          <h2>{isEditMode ? "Editar Receta" : "Nueva Receta"}</h2>
          <button className="crm-close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="crm-form" onSubmit={handleSubmit}>
          {error && <div className="crm-error">{error}</div>}

          <div className="crm-grid">
            {/* Columna izquierda */}
            <div className="crm-col">
              <label>
                Título
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label>
                Descripción
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label>
                URL de imagen
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <div className="crm-row-3">
                <label>
                  kcal
                  <input
                    type="number"
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                    min="0"
                  />
                </label>
                <label>
                  Minutos
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    min="0"
                  />
                </label>
                <label>
                  Porciones
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                  />
                </label>
              </div>
            </div>

            {/* Columna derecha: chips */}
            <div className="crm-col">
              {/* Dietas */}
              <div className="crm-chips-field">
                <span className="crm-chips-label">Dietas</span>
                <div className="crm-chips-container">
                  {diets.map((d) => (
                    <span key={d} className="crm-chip">
                      {d}
                      <button
                        type="button"
                        className="crm-chip-remove"
                        onClick={() => removeChip(d, diets, setDiets)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={dietInput}
                    onChange={(e) => setDietInput(e.target.value)}
                    onKeyDown={handleDietKeyDown}
                    placeholder="Escribe y Enter para agregar"
                    className="crm-chip-input"
                  />
                </div>
              </div>

              {/* Categorías */}
              <div className="crm-chips-field">
                <span className="crm-chips-label">Categorías</span>
                <div className="crm-chips-container">
                  {categories.map((c) => (
                    <span key={c} className="crm-chip">
                      {c}
                      <button
                        type="button"
                        className="crm-chip-remove"
                        onClick={() =>
                          removeChip(c, categories, setCategories)
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                    placeholder="Escribe y Enter para agregar"
                    className="crm-chip-input"
                  />
                </div>
              </div>

              {/* Etiquetas */}
              <div className="crm-chips-field">
                <span className="crm-chips-label">Etiquetas</span>
                <div className="crm-chips-container">
                  {tags.map((t) => (
                    <span key={t} className="crm-chip">
                      {t}
                      <button
                        type="button"
                        className="crm-chip-remove"
                        onClick={() => removeChip(t, tags, setTags)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Escribe y Enter para agregar"
                    className="crm-chip-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="crm-section">
            <label className="crm-section-label">Ingredientes</label>

            <div className="crm-ingredients-row">
              <input
                type="number"
                min="0"
                className="crm-ing-amount"
                placeholder="Cantidad"
                value={ingAmount}
                onChange={(e) => setIngAmount(e.target.value)}
              />
              <input
                type="text"
                className="crm-ing-unit"
                placeholder="Unidad (g, ml, taza...)"
                value={ingUnit}
                onChange={(e) => setIngUnit(e.target.value)}
              />
              <input
                type="text"
                className="crm-ing-name"
                placeholder="Nombre del ingrediente"
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
              />
              <button
                type="button"
                className="crm-btn-small"
                onClick={handleAddIngredient}
              >
                + Agregar
              </button>
            </div>

            {ingredients.length > 0 && (
              <ul className="crm-ingredients-list">
                {ingredients.map((ing, idx) => (
                  <li key={idx}>
                    <span className="crm-ing-main">
                      {ing.quantity != null && ing.quantity !== ""
                        ? `${ing.quantity}${
                            ing.unit ? " " + ing.unit : ""
                          } `
                        : ""}
                      {ing.name}
                    </span>
                    <button
                      type="button"
                      className="crm-chip-remove"
                      onClick={() => handleRemoveIngredient(idx)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pasos / Preparación */}
          <div className="crm-section">
            <label className="crm-section-label">Pasos / Preparación</label>

            <div className="crm-steps-list">
              {steps.map((step, idx) => (
                <div key={idx} className="crm-step-row">
                  <span className="crm-step-number">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) =>
                      handleStepChange(idx, e.target.value)
                    }
                    placeholder={`Paso ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="crm-chip-remove"
                    onClick={() => handleRemoveStep(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="crm-btn-outline-small"
              onClick={handleAddStep}
            >
              + Añadir otro paso
            </button>
          </div>

          <footer className="crm-footer">
            <button
              type="button"
              className="crm-btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button type="submit" className="crm-btn" disabled={submitting}>
              {submitting
                ? "Guardando..."
                : isEditMode
                ? "Guardar cambios"
                : "Guardar receta"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

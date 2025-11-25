import { useState } from "react";
import { useNavigate } from "react-router-dom";
import  api  from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/onboarding.css";

export default function Onboarding() {
  const { user, token, setUser } = useAuth();
  const navigate = useNavigate();

  // form principal (con arrays para las etiquetas)
  const [form, setForm] = useState({
    birthDate: "",
    gender: "prefer_not",
    heightCm: "",
    weightKg: "",
    activityLevel: "moderate",
    goal: "mantener",
    targetWeightKg: "",
    diets: [],                // ← ahora arrays
    allergies: [],
    dislikes: [],
    favouriteIngredients: [],
  });

  // inputs de texto para las etiquetas
  const [tagInputs, setTagInputs] = useState({
    diets: "",
    allergies: "",
    dislikes: "",
    favouriteIngredients: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // cambios de inputs "normales"
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // cambios de inputs de etiquetas
  const handleTagInputChange = (field, value) => {
    setTagInputs((prev) => ({ ...prev, [field]: value }));
  };

  // cuando se presiona Enter o coma en un input de etiquetas
  const handleTagKeyDown = (field) => (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = tagInputs[field].trim();
      if (!raw) return;

      setForm((prev) => {
        const current = prev[field] || [];
        if (current.includes(raw)) return prev; // evitar duplicados
        return {
          ...prev,
          [field]: [...current, raw],
        };
      });

      setTagInputs((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // eliminar una etiqueta
  const handleRemoveTag = (field, tag) => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  setError("");

  try {
    const payload = {
      ...form,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
      onboardingCompleted: true,
    };

    const res = await api.patch("/api/user/me", payload, token);

    // 🔥 Normalizamos el usuario actualizado
    const backendUser = res.user || res.data || res.updatedUser || null;

    if (setUser) {
      // Mezclamos lo que ya había en user con lo que venga del backend
      setUser((prev) => ({
        ...(prev || {}),
        ...(backendUser || {}),
        onboardingCompleted: true, // forzado por si el backend no lo mete
      }));
    }

    // Ir a la pantalla de inicio
    navigate("/pantalla-inicio");
  } catch (err) {
    console.error(err);
    setError(err.message || "Error guardando tus datos");
  } finally {
    setSaving(false);
  }
};

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <main className="onb-wrap">
      <section className="onb-card">
        <div className="onb-header">
          <h1>
            ¡Bienvenido a <span className="onb-brand">VitalFlow</span>
            {firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="onb-sub">
            A continuación te pediremos algunos datos para conocerte mejor y poder
            generar planes más personalizados para ti.
          </p>
        </div>

        {error && <div className="onb-error">{error}</div>}

        <form className="onb-grid" onSubmit={handleSubmit}>
          <div className="onb-field">
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
            />
          </div>

          <div className="onb-field">
            <label>Género</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="prefer_not">Prefiero no decir</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="onb-field">
            <label>Estatura (cm)</label>
            <input
              type="number"
              name="heightCm"
              value={form.heightCm}
              onChange={handleChange}
              min="100"
              max="250"
            />
          </div>

          <div className="onb-field">
            <label>Peso actual (kg)</label>
            <input
              type="number"
              name="weightKg"
              value={form.weightKg}
              onChange={handleChange}
              min="20"
              max="300"
            />
          </div>

          <div className="onb-field">
            <label>Objetivo</label>
            <select name="goal" value={form.goal} onChange={handleChange}>
              <option value="perder_peso">Perder peso</option>
              <option value="mantener">Mantener</option>
              <option value="ganar_masa">Ganar masa muscular</option>
              <option value="mejorar_salud">Mejorar salud general</option>
            </select>
          </div>

          <div className="onb-field">
            <label>Peso objetivo (kg)</label>
            <input
              type="number"
              name="targetWeightKg"
              value={form.targetWeightKg}
              onChange={handleChange}
              min="20"
              max="300"
            />
          </div>

          <div className="onb-field">
            <label>Nivel de actividad</label>
            <select
              name="activityLevel"
              value={form.activityLevel}
              onChange={handleChange}
            >
              <option value="sedentary">Sedentario</option>
              <option value="light">Ligero</option>
              <option value="moderate">Moderado</option>
              <option value="active">Activo</option>
              <option value="very_active">Muy activo</option>
            </select>
          </div>

          {/* Dietas */}
          <div className="onb-field onb-field-full">
            <label>Dietas o estilos</label>
            <div className="onb-tags">
              {form.diets.map((tag) => (
                <span className="onb-tag-chip" key={tag}>
                  {tag}
                  <button
                    type="button"
                    className="onb-tag-remove"
                    onClick={() => handleRemoveTag("diets", tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="onb-tag-input"
                placeholder="Escribe y presiona Enter"
                value={tagInputs.diets}
                onChange={(e) =>
                  handleTagInputChange("diets", e.target.value)
                }
                onKeyDown={handleTagKeyDown("diets")}
              />
            </div>
          </div>

          {/* Alergias */}
          <div className="onb-field onb-field-full">
            <label>Alergias</label>
            <div className="onb-tags">
              {form.allergies.map((tag) => (
                <span className="onb-tag-chip" key={tag}>
                  {tag}
                  <button
                    type="button"
                    className="onb-tag-remove"
                    onClick={() => handleRemoveTag("allergies", tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="onb-tag-input"
                placeholder="Escribe y presiona Enter"
                value={tagInputs.allergies}
                onChange={(e) =>
                  handleTagInputChange("allergies", e.target.value)
                }
                onKeyDown={handleTagKeyDown("allergies")}
              />
            </div>
          </div>

          {/* Alimentos que no le gustan */}
          <div className="onb-field onb-field-full">
            <label>Alimentos que no te gustan</label>
            <div className="onb-tags">
              {form.dislikes.map((tag) => (
                <span className="onb-tag-chip" key={tag}>
                  {tag}
                  <button
                    type="button"
                    className="onb-tag-remove"
                    onClick={() => handleRemoveTag("dislikes", tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="onb-tag-input"
                placeholder="Escribe y presiona Enter"
                value={tagInputs.dislikes}
                onChange={(e) =>
                  handleTagInputChange("dislikes", e.target.value)
                }
                onKeyDown={handleTagKeyDown("dislikes")}
              />
            </div>
          </div>

          {/* Ingredientes favoritos */}
          <div className="onb-field onb-field-full">
            <label>Ingredientes favoritos</label>
            <div className="onb-tags">
              {form.favouriteIngredients.map((tag) => (
                <span className="onb-tag-chip" key={tag}>
                  {tag}
                  <button
                    type="button"
                    className="onb-tag-remove"
                    onClick={() =>
                      handleRemoveTag("favouriteIngredients", tag)
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="onb-tag-input"
                placeholder="Escribe y presiona Enter"
                value={tagInputs.favouriteIngredients}
                onChange={(e) =>
                  handleTagInputChange("favouriteIngredients", e.target.value)
                }
                onKeyDown={handleTagKeyDown("favouriteIngredients")}
              />
            </div>
          </div>

          <div className="onb-actions">
            {/* <button
              type="button"
              className="onb-skip"
              onClick={() => navigate("/pantalla-inicio")}
            >
              Saltar por ahora
            </button> */}
            <button type="submit" className="onb-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
import React, { useEffect, useState } from "react";
import "../styles/Perfil.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

function getToken() {
  return (
    localStorage.getItem("vitalflow_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

/**
 * Componente reutilizable para campos tipo “etiquetas”.
 * Muestra chips + input para agregar más.
 */
function TagInput({ label, values, onChange, placeholder, helper }) {
  const [inputValue, setInputValue] = useState("");

  const normalized = Array.isArray(values) ? values : [];

  const addTagFromValue = () => {
    const v = inputValue.trim();
    if (!v) return;
    // Evitar duplicados (case-insensitive)
    const exists = normalized.some(
      (t) => t.toLowerCase() === v.toLowerCase()
    );
    if (exists) {
      setInputValue("");
      return;
    }
    onChange([...normalized, v]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (["Enter", ",", ";", "Tab"].includes(e.key)) {
      e.preventDefault();
      addTagFromValue();
    }
    if (e.key === "Backspace" && !inputValue && normalized.length > 0) {
      // Borrar último tag si el input está vacío
      onChange(normalized.slice(0, -1));
    }
  };

  const handleBlur = () => {
    // Cuando sale del input, intentamos agregar lo que haya escrito
    if (inputValue.trim()) {
      addTagFromValue();
    }
  };

  const removeTag = (idx) => {
    const next = normalized.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="tag-field full">
      <label className="tag-label">
        {label}
        {helper && <span className="muted helper">{helper}</span>}
      </label>
      <div className="tag-input">
        <div className="tag-list">
          {normalized.map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="tag-pill">
              {tag}
              <button
                type="button"
                className="tag-pill-remove"
                onClick={() => removeTag(idx)}
                aria-label={`Eliminar ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="tag-input-inner"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder || "Escribe y presiona Enter"}
          />
        </div>
      </div>
    </div>
  );
}

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState({
    name: "",
    bio: "",
    birthDate: "",
    gender: "prefer_not",
    heightCm: "",
    weightKg: "",
    activityLevel: "moderate",
    // ahora como ARRAYS
    diets: [],
    allergies: [],
    dislikes: [],
    favouriteIngredients: [],
    goal: "mantener",
    targetWeightKg: "",
    locale: "es-MX",
    units: "metric",
    onboardingCompleted: false,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) throw new Error("No autenticado");
      const res = await fetch(`${API}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg || "No se pudo obtener perfil");
      const u = json.user;
      setUser(u);

      setForm((s) => ({
        ...s,
        name: u.name || "",
        bio: u.bio || "",
        birthDate: u.birthDate
          ? new Date(u.birthDate).toISOString().slice(0, 10)
          : "",
        gender: u.gender || s.gender,
        heightCm: u.heightCm ?? "",
        weightKg: u.weightKg ?? "",
        activityLevel: u.activityLevel || s.activityLevel,
        diets: Array.isArray(u.diets)
          ? u.diets
          : u.diets
          ? String(u.diets)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        allergies: Array.isArray(u.allergies)
          ? u.allergies
          : u.allergies
          ? String(u.allergies)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        dislikes: Array.isArray(u.dislikes)
          ? u.dislikes
          : u.dislikes
          ? String(u.dislikes)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        favouriteIngredients: Array.isArray(u.favouriteIngredients)
          ? u.favouriteIngredients
          : u.favouriteIngredients
          ? String(u.favouriteIngredients)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        goal: u.goal || s.goal,
        targetWeightKg: u.targetWeightKg ?? "",
        locale: u.locale || s.locale,
        units: u.units || s.units,
        onboardingCompleted: !!u.onboardingCompleted,
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatar = (e) => {
    setAvatarFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setError("");
    setStatusMsg("");
    const token = getToken();
    if (!token) {
      setError("No autenticado");
      return;
    }

    // ahora mandamos arrays directamente
    const payload = {
      name: form.name,
      bio: form.bio,
      birthDate: form.birthDate || null,
      gender: form.gender,
      heightCm: form.heightCm || null,
      weightKg: form.weightKg || null,
      activityLevel: form.activityLevel,
      diets: form.diets || [],
      allergies: form.allergies || [],
      dislikes: form.dislikes || [],
      favouriteIngredients: form.favouriteIngredients || [],
      goal: form.goal,
      targetWeightKg: form.targetWeightKg || null,
      locale: form.locale,
      units: form.units,
      onboardingCompleted: !!form.onboardingCompleted,
    };

    try {
      setLoading(true);
      let res;

      if (avatarFile) {
        const fd = new FormData();
        Object.keys(payload).forEach((k) => {
          const val = payload[k];
          if (Array.isArray(val)) {
            fd.append(k, JSON.stringify(val));
          } else if (val !== undefined && val !== null) {
            fd.append(k, val);
          }
        });
        fd.append("avatar", avatarFile);

        res = await fetch(`${API}/api/user/profile`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      } else {
        res = await fetch(`${API}/api/user/me`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.msg || "Error actualizando perfil");

      setStatusMsg("Perfil actualizado correctamente");
      await fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Perfil</h1>
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="vf-perfil page-container">
      <h1 className="page-title">Mi Perfil</h1>
      <p className="page-sub">
        Gestiona tu información personal, objetivos y preferencias nutricionales
      </p>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          Personal
        </button>
        <button
          className={`tab ${activeTab === "nutrition" ? "active" : ""}`}
          onClick={() => setActiveTab("nutrition")}
        >
          Nutrición
        </button>
        <button
          className={`tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          Notificaciones
        </button>
        <button
          className={`tab ${activeTab === "privacy" ? "active" : ""}`}
          onClick={() => setActiveTab("privacy")}
        >
          Privacidad
        </button>
      </div>

      <div className="perfil-card">
        {/* COLUMNA IZQUIERDA - Avatar + resumen */}
        <div className="perfil-left">
          <div className="avatar-wrap">
            {user && user.avatarUrl ? (
              <img
                src={
                  user.avatarUrl.startsWith("http")
                    ? user.avatarUrl
                    : `${API}${user.avatarUrl}`
                }
                alt="Avatar"
                className="avatar big"
              />
            ) : (
              <div className="avatar placeholder big">
                {user && user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <div className="basic-info">
            <h2>{user?.name || "Sin nombre"}</h2>
            <p className="muted">{user?.email}</p>
            <p>
              Rol: <strong>{user?.role}</strong>{" "}
              {user?.isVerified ? (
                <span className="badge ok">Verificado</span>
              ) : (
                <span className="badge">No verificado</span>
              )}
            </p>
            <p className="muted">
              Cuenta creada:{" "}
              {user ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA - Formularios por pestaña */}
        <div className="perfil-right">
          {statusMsg && <div className="vf-success">{statusMsg}</div>}
          {error && <div className="vf-error">{error}</div>}

          {activeTab === "personal" && (
            <form className="form-grid" onSubmit={handleSave}>
              <label>
                Nombre completo
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </label>

              <label>
                Email
                <input value={user?.email || ""} readOnly />
                <small className="muted">
                  El email no se puede modificar
                </small>
              </label>

              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                />
              </label>

              <label>
                Sexo
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Otro</option>
                  <option value="prefer_not">Prefiero no decir</option>
                </select>
              </label>

              <label>
                Peso (kg)
                <input
                  name="weightKg"
                  value={form.weightKg}
                  onChange={handleChange}
                />
              </label>

              <label>
                Altura (cm)
                <input
                  name="heightCm"
                  value={form.heightCm}
                  onChange={handleChange}
                />
              </label>

              <label className="full">
                Biografía
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                />
              </label>

              <label className="file-label full">
                Foto de perfil
                <span className="file-trigger">
                  📷 Cambiar avatar
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatar}
                />
                {avatarFile && (
                  <span className="file-name">
                    Archivo seleccionado: {avatarFile.name}
                  </span>
                )}
              </label>

              <div className="form-actions full">
                <button type="submit" className="btn-primary">
                  {loading ? "Guardando..." : "Guardar cambios personales"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "nutrition" && (
            <form className="form-grid" onSubmit={handleSave}>
              <label>
                Objetivo principal
                <select
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                >
                  <option value="perder_peso">Perder peso</option>
                  <option value="mantener">Mantener peso</option>
                  <option value="ganar_masa">Ganar masa</option>
                  <option value="mejorar_salud">Mejorar salud</option>
                </select>
              </label>

              <label>
                Nivel de actividad
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
              </label>

              <label>
                Peso objetivo (kg)
                <input
                  name="targetWeightKg"
                  value={form.targetWeightKg}
                  onChange={handleChange}
                />
              </label>

              <label>
                Unidades
                <select
                  name="units"
                  value={form.units}
                  onChange={handleChange}
                >
                  <option value="metric">Métrico (kg, cm)</option>
                  <option value="imperial">Imperial (lb, ft)</option>
                </select>
              </label>

              {/* TAG INPUTS */}
              <TagInput
                label="Dietas / estilos de alimentación"
                values={form.diets}
                onChange={(vals) =>
                  setForm((s) => ({ ...s, diets: vals }))
                }
                placeholder="Ej. vegetariana, vegana, low carb..."
                helper="Escribe un término y presiona Enter para agregarlo."
              />

              <TagInput
                label="Alergias"
                values={form.allergies}
                onChange={(vals) =>
                  setForm((s) => ({ ...s, allergies: vals }))
                }
                placeholder="Ej. gluten, nueces, lácteos..."
                helper="Estas alergias se usarán para filtrar tus planes y recetas."
              />

              <TagInput
                label="Alimentos a evitar"
                values={form.dislikes}
                onChange={(vals) =>
                  setForm((s) => ({ ...s, dislikes: vals }))
                }
                placeholder="Ej. cebolla, cilantro, picante..."
                helper="Ingredientes que prefieres no ver en tus recetas."
              />

              <TagInput
                label="Ingredientes favoritos"
                values={form.favouriteIngredients}
                onChange={(vals) =>
                  setForm((s) => ({ ...s, favouriteIngredients: vals }))
                }
                placeholder="Ej. pollo, avena, plátano..."
                helper="La IA puede priorizar estos ingredientes en tus planes."
              />

              <div className="form-actions full">
                <button type="submit" className="btn-primary">
                  Guardar preferencias nutricionales
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="settings">
              <h3>Configuración de Notificaciones</h3>
              <label className="setting-item">
                <div>
                  <strong>Recordatorios de comidas</strong>
                  <div className="muted">
                    Recibe notificaciones para tus horarios de comida
                  </div>
                </div>
                <input type="checkbox" disabled />
              </label>

              <label className="setting-item">
                <div>
                  <strong>Actualizaciones de retos</strong>
                  <div className="muted">
                    Notificaciones sobre el progreso de tus retos
                  </div>
                </div>
                <input type="checkbox" disabled />
              </label>

              <div className="form-actions full">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => alert("Guardado (demo)")}
                >
                  Guardar configuración de notificaciones
                </button>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="settings">
              <h3>Configuración de Privacidad</h3>
              <label className="setting-item">
                <div>
                  <strong>Perfil visible</strong>
                  <div className="muted">
                    Permite que otros usuarios vean tu perfil básico
                  </div>
                </div>
                <input type="checkbox" disabled />
              </label>

              <div className="form-actions full">
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => alert("Guardado (demo)")}
                >
                  Guardar configuración de privacidad
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
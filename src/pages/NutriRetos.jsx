// src/pages/NutriRetos.jsx
import { useEffect, useState } from "react";
import {
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from "../services/challengeService";
import { useAuth } from "../contexts/AuthContext";
import "../styles/NutriRetos.css";

export default function NutriRetos() {
  const { token } = useAuth();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // 'active' | 'inactive' | 'all'

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // reto que se edita o null (crear)
  const [saving, setSaving] = useState(false);

  // formulario
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationDays: 7,
    rewardPoints: 10,
    imageUrl: "",
    tags: [],
    tagsInput: "",
    isActive: true,
  });

  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // búsqueda reactiva mientras escribe
  useEffect(() => {
    const t = setTimeout(() => {
      fetchChallenges({ q: search });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchChallenges(opts = {}) {
    try {
      setLoading(true);
      const qVal = opts.q ?? search;
      const statusVal = opts.status ?? statusFilter;

      const res = await listChallenges({
        q: qVal,
        status: statusVal,
        limit: 50,
      });

      setChallenges(res.data || []);
    } catch (err) {
      console.error("Error listChallenges", err);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      durationDays: 7,
      rewardPoints: 10,
      imageUrl: "",
      tags: [],
      tagsInput: "",
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(ch) {
    setEditing(ch);
    setForm({
      title: ch.title || "",
      description: ch.description || "",
      durationDays: ch.durationDays || 7,
      rewardPoints: ch.rewardPoints || 10,
      imageUrl: ch.imageUrl || "",
      tags: ch.tags || [],
      tagsInput: "",
      isActive: ch.isActive !== undefined ? ch.isActive : true,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === "durationDays" || name === "rewardPoints"
          ? Number(value)
          : value,
    }));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (!value) return;
      setForm((f) => {
        if (f.tags.includes(value)) {
          return { ...f, tagsInput: "" };
        }
        return {
          ...f,
          tags: [...f.tags, value],
          tagsInput: "",
        };
      });
    }
  }

  function handleRemoveTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.filter((t) => t !== tag),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      alert("No hay token de sesión");
      return;
    }
    try {
      setSaving(true);
      const tags = form.tags || [];

      const body = {
        title: form.title,
        description: form.description,
        durationDays: form.durationDays || 7,
        rewardPoints: form.rewardPoints || 10,
        imageUrl: form.imageUrl,
        tags,
        isActive: form.isActive,
      };

      if (editing && editing._id) {
        await updateChallenge(token, editing._id, body);
      } else {
        await createChallenge(token, body);
      }

      await fetchChallenges();
      closeModal();
    } catch (err) {
      console.error("save challenge", err);
      alert(err?.response?.data?.msg || "Error al guardar el reto");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(ch) {
    if (!token) return;
    try {
      await updateChallenge(token, ch._id, { isActive: !ch.isActive });
      await fetchChallenges();
    } catch (err) {
      console.error("toggle active", err);
      alert("Error al activar/desactivar el reto");
    }
  }

  async function handleDelete(ch) {
    if (!token) return;
    const ok = window.confirm(
      `¿Seguro que deseas eliminar el reto "${ch.title}"?`
    );
    if (!ok) return;
    try {
      await deleteChallenge(token, ch._id);
      await fetchChallenges();
    } catch (err) {
      console.error("delete challenge", err);
      alert("Error al eliminar el reto");
    }
  }

  function handleChangeStatus(newStatus) {
    setStatusFilter(newStatus);
    // también refrescamos de inmediato
    fetchChallenges({ status: newStatus });
  }

  return (
    <main className="nutri-retos-page">
      <header className="nutri-retos-header">
        <div>
          <h1 className="nutri-retos-title">Gestión de retos</h1>
          <p className="nutri-retos-sub">
            Crea y administra retos para acompañar a tus pacientes en sus
            hábitos diarios.
          </p>
        </div>
      </header>

      {/* barra de búsqueda + stats + filtros de estado */}
      <section className="nutri-retos-toolbar">
        <div className="nutri-retos-search">
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o etiqueta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

                <div className="nutri-retos-right">
          <div className="nutri-retos-status-filters">
            <button
              type="button"
              className={
                "status-chip " + (statusFilter === "active" ? "active" : "")
              }
              onClick={() => handleChangeStatus("active")}
            >
              Activos
            </button>
            <button
              type="button"
              className={
                "status-chip " + (statusFilter === "inactive" ? "active" : "")
              }
              onClick={() => handleChangeStatus("inactive")}
            >
              Inactivos
            </button>
            <button
              type="button"
              className={
                "status-chip " + (statusFilter === "all" ? "active" : "")
              }
              onClick={() => handleChangeStatus("all")}
            >
              Todos
            </button>
          </div>
        </div>
      </section>

      {/* línea de resultados */}
      <div className="nutri-retos-results">
        <span>
          {challenges.filter((c) => c.isActive !== false).length} retos activos de{" "}
          {challenges.length} resultados en la vista
          <br />
          <br />
        </span>
      </div>
      {/* listado */}
      <section className="nutri-retos-grid">
        {loading && <div className="nutri-retos-muted">Cargando retos...</div>}
        {!loading && challenges.length === 0 && (
          <div className="nutri-retos-empty">
            <p>No hay retos para el filtro seleccionado.</p>
            <button
              className="nutri-retos-btn-primary"
              onClick={openCreateModal}
            >
              Crear mi primer reto
            </button>
          </div>
        )}

        {!loading &&
          challenges.map((ch) => (
            <article key={ch._id} className="nutri-retos-card">
              {ch.imageUrl ? (
                <div className="nutri-retos-card-img-wrapper">
                  <img
                    src={ch.imageUrl}
                    alt={ch.title}
                    className="nutri-retos-card-img"
                  />
                  <span
                    className={`nutri-retos-badge ${
                      ch.isActive !== false ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {ch.isActive !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ) : (
                <div className="nutri-retos-card-img placeholder">
                  <span>Sin imagen</span>
                  <span
                    className={`nutri-retos-badge ${
                      ch.isActive !== false ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {ch.isActive !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
              )}

              <div className="nutri-retos-card-body">
                <h3 className="nutri-retos-card-title">{ch.title}</h3>
                <p className="nutri-retos-card-desc">{ch.description}</p>

                {(ch.tags || []).length > 0 && (
                  <div className="nutri-retos-tags">
                    {ch.tags.map((t) => (
                      <span key={t} className="nutri-retos-tag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="nutri-retos-meta">
                  <span>⏱ {ch.durationDays || 7} días</span>
                  <span>🏅 {ch.rewardPoints || 10} pts</span>
                </div>

                {ch.createdAt && (
                  <div className="nutri-retos-meta small">
                    Creado el{" "}
                    {new Date(ch.createdAt).toLocaleDateString("es-MX")}
                  </div>
                )}

                <div className="nutri-retos-actions">
                  <button
                    className="nutri-retos-btn-outline"
                    onClick={() => openEditModal(ch)}
                  >
                    Editar
                  </button>
                  <button
                    className="nutri-retos-btn-ghost"
                    onClick={() => handleToggleActive(ch)}
                  >
                    {ch.isActive !== false ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    className="nutri-retos-btn-danger"
                    onClick={() => handleDelete(ch)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
      </section>

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="nutri-retos-modal-backdrop" onClick={closeModal}>
          <div
            className="nutri-retos-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nutri-retos-modal-header">
              <h2>{editing ? "Editar reto" : "Nuevo reto"}</h2>
              <button
                type="button"
                className="nutri-retos-close-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            <form className="nutri-retos-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Título *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <label>Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Ej. Camina 8,000 pasos diarios durante una semana..."
                />
              </div>

              <div className="form-row two-cols">
                <div>
                  <label>Duración (días)</label>
                  <input
                    type="number"
                    name="durationDays"
                    min={1}
                    value={form.durationDays}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label>Puntos de recompensa</label>
                  <input
                    type="number"
                    name="rewardPoints"
                    min={1}
                    value={form.rewardPoints}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>URL de imagen</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-row">
                <label>Etiquetas</label>
                <div className="tag-input-wrapper">
                  <div className="tag-chips-input">
                    {form.tags && form.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                        <button
                          type="button"
                          className="tag-chip-remove"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="tag-input"
                      value={form.tagsInput}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tagsInput: e.target.value }))
                      }
                      onKeyDown={handleTagKeyDown}
                      placeholder={
                        form.tags && form.tags.length
                          ? "Pulsa Enter para agregar otra etiqueta"
                          : "Escribe y pulsa Enter para agregar etiqueta"
                      }
                    />
                  </div>
                  <span className="tag-hint">
                    Usa Enter o coma para agregar una etiqueta.
                  </span>
                </div>
              </div>

              <div className="form-row checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                  />
                  <span>Mantener reto activo y visible</span>
                </label>
              </div>

              <footer className="nutri-retos-modal-footer">
                <button
                  type="button"
                  className="nutri-retos-btn-ghost"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="nutri-retos-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? editing
                      ? "Guardando..."
                      : "Creando..."
                    : editing
                    ? "Guardar cambios"
                    : "Crear reto"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Botón flotante circular */}
      <button
        type="button"
        className="nutri-retos-fab"
        onClick={openCreateModal}
        aria-label="Crear nuevo reto"
      >
        +
      </button>
    </main>
  );
}

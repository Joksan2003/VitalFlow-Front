// src/pages/AdminUsuarios.jsx
import { useEffect, useState } from "react";
import  api  from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/AdminUsuarios.css";

export default function AdminUsuarios() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filtros
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  // modal de detalle/edición
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState("user");
  const [editVerified, setEditVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  // modal de confirmación de borrado
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // protección simple (por si alguien entra a la ruta manualmente)
  if (currentUser && currentUser.role !== "admin") {
    return (
      <main className="admin-users-page">
        <h1 className="admin-users-title">Acceso restringido</h1>
        <p className="admin-users-muted">
          Solo los administradores pueden ver y gestionar usuarios.
        </p>
      </main>
    );
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (search.trim()) params.append("q", search.trim());
      if (role !== "all") params.append("role", role);
      params.append("page", page);
      params.append("limit", limit);

      const query = params.toString();
      // 👇 AQUÍ EL CAMBIO IMPORTANTE
      const res = await api.get(`/api/admin/users?${query}`, token);

      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      setError(
        err?.body?.msg || "Error cargando usuarios. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  function openUserModal(u) {
    setSelectedUser(u);
    setEditRole(u.role || "user");
    setEditVerified(Boolean(u.isVerified));
  }

  function closeUserModal() {
    setSelectedUser(null);
    setSaving(false);
  }

  async function handleSaveUser() {
    if (!selectedUser) return;
    try {
      setSaving(true);
      // 👇 AQUÍ TAMBIÉN
      const res = await api.patch(
        `/api/admin/users/${selectedUser._id}`,
        {
          role: editRole,
          isVerified: editVerified,
        },
        token
      );
      const updated = res.user;

      // actualizar en lista
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );
      closeUserModal();
    } catch (err) {
      console.error(err);
      alert(
        err?.body?.msg ||
          "Error guardando cambios del usuario. Intenta de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(u) {
    setDeleteUser(u);
  }

  function closeDeleteModal() {
    setDeleteUser(null);
    setDeleting(false);
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return;
    try {
      setDeleting(true);
      // 👇 Y AQUÍ
      await api.delete(`/api/admin/users/${deleteUser._id}`, token);
      setUsers((prev) => prev.filter((u) => u._id !== deleteUser._id));
      closeDeleteModal();
    } catch (err) {
      console.error(err);
      alert(
        err?.body?.msg ||
          "Error al eliminar usuario. Intenta de nuevo."
      );
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="admin-users-page">
      {/* Encabezado */}
      <header className="admin-users-header">
        <div>
          <h1 className="admin-users-title">Gestión de usuarios</h1>
          <p className="admin-users-subtitle">
            Administra los usuarios registrados, sus roles y estado en VitalFlow.
          </p>
        </div>
        <div className="admin-users-stats">
          <div className="admin-users-stat">
            <span className="stat-label">Total registrados</span>
            <span className="stat-value">{total}</span>
          </div>
        </div>
      </header>

      {/* Barra de filtros */}
      <section className="admin-users-filters">
        <form onSubmit={handleSearchSubmit} className="filters-left">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </div>
        </form>

        <div className="filters-right">
          <label className="filter-label">
            Rol:
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="user">Usuario</option>
              <option value="nutriologo">Nutriólogo</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
      </section>

      {/* Estado de carga / error */}
      {loading && <div className="admin-users-loading">Cargando usuarios…</div>}
      {error && <div className="admin-users-error">{error}</div>}

      {/* Tabla de usuarios */}
      {!loading && !error && (
        <section className="admin-users-table-wrapper">
          {users.length === 0 ? (
            <div className="admin-users-empty">No se encontraron usuarios.</div>
          ) : (
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Verificado</th>
                  <th>Nutriólogo asignado</th>
                  <th>Registrado</th>
                  <th>Puntos</th>
                  <th className="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name || u.email} />
                          ) : (
                            <div className="avatar-placeholder">
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{u.name || "Sin nombre"}</div>
                          <div className="user-bio">
                            {u.bio
                              ? u.bio.slice(0, 50) +
                                (u.bio.length > 50 ? "…" : "")
                              : "Sin descripción"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === "user" && "Usuario"}
                        {u.role === "nutriologo" && "Nutriólogo"}
                        {u.role === "admin" && "Admin"}
                      </span>
                    </td>
                    <td>
                      {u.isVerified ? (
                        <span className="tag tag-verified">Verificado</span>
                      ) : (
                        <span className="tag tag-unverified">Pendiente</span>
                      )}
                    </td>
                    <td>
                      {u.nutriologoAssigned ? (
                        <span className="tag tag-nutri">Asignado</span>
                      ) : (
                        <span className="tag tag-muted">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{u.points || 0}</td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => openUserModal(u)}
                      >
                        Ver / Editar
                      </button>
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => openDeleteModal(u)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="admin-users-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <span>
                Página {page} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Modal detalle / edición de usuario */}
      {selectedUser && (
        <div className="admin-users-modal-backdrop" onClick={closeUserModal}>
          <div
            className="admin-users-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Perfil de usuario</h2>
              <button className="close-btn" onClick={closeUserModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-user-main">
                <div className="avatar big">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name || selectedUser.email}
                    />
                  ) : (
                    <div className="avatar-placeholder big">
                      {(selectedUser.name || selectedUser.email || "?")
                        [0]
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3>{selectedUser.name || "Sin nombre"}</h3>
                  <p className="email">{selectedUser.email}</p>
                  {selectedUser.bio && (
                    <p className="bio">{selectedUser.bio}</p>
                  )}
                </div>
              </div>

              <div className="modal-grid">
                <div className="modal-section">
                  <h4>Datos básicos</h4>
                  <p>
                    <span className="label">Rol actual:</span>{" "}
                    <span className={`role-badge role-${selectedUser.role}`}>
                      {selectedUser.role === "user" && "Usuario"}
                      {selectedUser.role === "nutriologo" && "Nutriólogo"}
                      {selectedUser.role === "admin" && "Admin"}
                    </span>
                  </p>
                  <p>
                    <span className="label">Verificación:</span>{" "}
                    {selectedUser.isVerified ? "Verificado" : "Pendiente"}
                  </p>
                  {selectedUser.age && (
                    <p>
                      <span className="label">Edad:</span>{" "}
                      {selectedUser.age} años
                    </p>
                  )}
                  {selectedUser.heightCm && (
                    <p>
                      <span className="label">Estatura:</span>{" "}
                      {selectedUser.heightCm} cm
                    </p>
                  )}
                  {selectedUser.weightKg && (
                    <p>
                      <span className="label">Peso:</span>{" "}
                      {selectedUser.weightKg} kg
                    </p>
                  )}
                </div>

                <div className="modal-section">
                  <h4>Preferencias nutricionales</h4>
                  <p>
                    <span className="label">Objetivo:</span>{" "}
                    {selectedUser.goal || "No especificado"}
                  </p>
                  <div className="chips-row">
                    {selectedUser.diets?.map((d) => (
                      <span key={d} className="chip">
                        {d}
                      </span>
                    ))}
                    {(!selectedUser.diets ||
                      selectedUser.diets.length === 0) && (
                      <span className="muted">Sin dietas especificadas</span>
                    )}
                  </div>

                  {selectedUser.allergies?.length > 0 && (
                    <>
                      <p className="label mt-8">Alergias:</p>
                      <div className="chips-row">
                        {selectedUser.allergies.map((a) => (
                          <span key={a} className="chip chip-danger">
                            {a}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedUser.dislikes?.length > 0 && (
                    <>
                      <p className="label mt-8">No le gusta:</p>
                      <div className="chips-row">
                        {selectedUser.dislikes.map((d) => (
                          <span key={d} className="chip chip-muted">
                            {d}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-section">
                  <h4>Editar (solo admin)</h4>
                  <label className="form-field">
                    <span>Rol del usuario</span>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="user">Usuario</option>
                      <option value="nutriologo">Nutriólogo</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>

                  <label className="form-field checkbox">
                    <input
                      type="checkbox"
                      checked={editVerified}
                      onChange={(e) => setEditVerified(e.target.checked)}
                    />
                    <span>Marcar como verificado</span>
                  </label>

                  <button
                    className="btn-primary"
                    disabled={saving}
                    onClick={handleSaveUser}
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteUser && (
        <div className="admin-users-modal-backdrop" onClick={closeDeleteModal}>
          <div
            className="admin-users-modal small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Eliminar usuario</h2>
              <button className="close-btn" onClick={closeDeleteModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Seguro que deseas eliminar al usuario{" "}
                <strong>{deleteUser.name || deleteUser.email}</strong>?
              </p>
              <p className="admin-users-warning">
                Esta acción no se puede deshacer y se perderá su información
                asociada (planes, retos, etc.).
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className="btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
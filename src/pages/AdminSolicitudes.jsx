import { useEffect, useState } from "react";
import  api  from "../utils/api";        // ⬅️ aquí el cambio
import { useAuth } from "../contexts/AuthContext"; 
import "../styles/AdminSolicitudes.css";

export default function AdminSolicitudes() {
  const { token } = useAuth();   // 👈 NUEVO
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // 'all' | 'pending' | 'approved' | 'rejected' | 'needs_info'
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // solicitud seleccionada
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
        if (!token) return;           // si no hay token, no llamamos todavía
      fetchRequests();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, token]);

  async function fetchRequests() {
  try {
    if (!token) return;          // seguridad extra
    setLoading(true);
    let qs = `?page=${page}&limit=${limit}`;
    if (statusFilter !== "all") {
      qs += `&status=${statusFilter}`;
    }
    if (search.trim()) {
      qs += `&q=${encodeURIComponent(search.trim())}`;
    }

    // ⬇️ PASAR TOKEN
    const res = await api.get(`/api/admin/nutriologo/requests${qs}`, token);

    const list =
      res.requests || res.data || res.items || res.results || [];
    const totalItems = res.total || res.totalItems || list.length;

    setRequests(list);
    setTotal(totalItems);
  } catch (err) {
    console.error("Error cargando solicitudes:", err);
    setRequests([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  }

  function openDetails(req) {
    setSelected(req);
    setAdminNotes(req.adminNotes || "");
  }

  function closeDetails() {
    setSelected(null);
    setAdminNotes("");
  }

  async function handleAction(type) {
  if (!selected?._id || !token) return;
  setActionLoading(true);
  try {
    let endpoint = "";
    if (type === "approve") {
      endpoint = `/api/admin/nutriologo/requests/${selected._id}/approve`;
    } else if (type === "reject") {
      endpoint = `/api/admin/nutriologo/requests/${selected._id}/reject`;
    } else if (type === "needs_info") {
      endpoint = `/api/admin/nutriologo/requests/${selected._id}/needs-info`;
    }

    // ⬇️ PASAR TOKEN
    await api.post(endpoint, { adminNotes }, token);

      // Actualizar en memoria
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selected._id
            ? {
                ...r,
                status:
                  type === "approve"
                    ? "approved"
                    : type === "reject"
                    ? "rejected"
                    : "needs_info",
                adminNotes,
              }
            : r
        )
      );

      // Si estabas filtrando "pending" y ya no es pendiente, recarga
      if (statusFilter === "pending") {
        await fetchRequests();
      }

      closeDetails();
      alert(
        type === "approve"
          ? "Solicitud aprobada correctamente."
          : type === "reject"
          ? "Solicitud rechazada."
          : "Marcada como: requiere más información."
      );
    } catch (err) {
      console.error("Error en acción admin:", err);
      alert("Error al procesar la acción.");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function renderStatusPill(status) {
    const s = status || "pending";
    return (
      <span className={`status-pill status-${s}`}>
        {s === "pending" && "Pendiente"}
        {s === "approved" && "Aprobada"}
        {s === "rejected" && "Rechazada"}
        {s === "needs_info" && "Requiere info"}
      </span>
    );
  }

  return (
    <main className="admin-solicitudes-page">
      <header className="admin-sol-header">
        <div>
          <h1 className="admin-sol-title">Solicitudes de Nutriólogos</h1>
          <p className="admin-sol-sub">
            Revisa, valida y aprueba las solicitudes de usuarios que desean
            convertirse en nutriólogos dentro de VitalFlow.
          </p>
        </div>
        <div className="admin-sol-counter">
          <span className="label">Total</span>
          <span className="value">{total}</span>
        </div>
      </header>

      {/* filtros */}
      <section className="admin-sol-filters">
        <div className="status-tabs">
          {[
            { key: "all", label: "Todas" },
            { key: "pending", label: "Pendientes" },
            { key: "approved", label: "Aprobadas" },
            { key: "rejected", label: "Rechazadas" },
            { key: "needs_info", label: "Requiere info" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`status-tab ${
                statusFilter === tab.key ? "active" : ""
              }`}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
      </section>

      {/* tabla */}
      <section className="admin-sol-table-wrap">
        {loading ? (
          <div className="admin-sol-empty">Cargando solicitudes...</div>
        ) : requests.length === 0 ? (
          <div className="admin-sol-empty">
            No se encontraron solicitudes con los filtros actuales.
          </div>
        ) : (
          <table className="admin-sol-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Ciudad</th>
                <th>Cédula / ID</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const user = r.user || r.userId || {};
                return (
                  <tr key={r._id}>
                    <td>{r.fullName || user.name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>{r.city || "—"}</td>
                    <td>{r.professionalId || "—"}</td>
                    <td>{renderStatusPill(r.status)}</td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      <button
                        className="btn-link"
                        type="button"
                        onClick={() => openDetails(r)}
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* paginación simple */}
        {totalPages > 1 && (
          <div className="admin-sol-pagination">
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

      {/* MODAL DETALLE */}
      {selected && (
        <div className="admin-sol-modal-backdrop" onClick={closeDetails}>
          <div
            className="admin-sol-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ... resto igual ... */}
          </div>
        </div>
      )}
    </main>
  );
}
import React, { useEffect, useState } from "react";
import "../styles/SolicitudNutri.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

function getToken() {
  return (
    localStorage.getItem("vitalflow_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

export default function SolicitudNutriologo() {
  const [form, setForm] = useState({
  fullName: "",
  phone: "",
  city: "",
  notes: "",

  // NUEVOS CAMPOS PROFESIONALES
  professionalId: "",
  degree: "",
  university: "",
  yearsExperience: "",

  // specialties ahora es ARRAY
  specialties: [],

  // SERVICIOS
  mainWorkplace: "",
  modalities: "Presencial",
  website: "",
  instagram: "",
  });

  const [files, setFiles] = useState({ certificate: null, cv: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingRequest, setExistingRequest] = useState(null);
  const [specialtyInput, setSpecialtyInput] = useState("");

  // comprobar si ya existe solicitud al montar
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/nutriologo/request/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok && json.request) {
          setExistingRequest(json.request);
        }
      } catch (err) {
        console.warn("No se pudo comprobar solicitud previa", err);
      }
    })();
  }, []);

  const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === "specialtyInput") {
    setSpecialtyInput(value);
    return;
  }
  // No queremos que 'specialties' venga como string aquí
  if (name === "specialties") return;

  setForm((s) => ({ ...s, [name]: value }));
};

  const handleFile = (e) => {
    const { name, files: f } = e.target;
    setFiles((s) => ({ ...s, [name]: f && f[0] ? f[0] : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (existingRequest && existingRequest.status === "pending") {
      setError("Ya tienes una solicitud pendiente. Espera a que el administrador la revise.");
      return;
    }

    // validaciones básicas
    if (!form.fullName || !form.phone || !form.city) {
      setError("Completa nombre, teléfono y ciudad.");
      return;
    }
    if (!form.professionalId || !form.degree || !form.university) {
      setError("Completa cédula profesional, título y universidad.");
      return;
    }
    if (!files.certificate) {
      setError("Debes adjuntar al menos un certificado (PDF o imagen).");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("No estás autenticado. Inicia sesión e intenta de nuevo.");
      return;
    }

    const fd = new FormData();
    // básicos
    fd.append("fullName", form.fullName);
    fd.append("phone", form.phone);
    fd.append("city", form.city);
    fd.append("notes", form.notes || "");

    // profesionales
    fd.append("professionalId", form.professionalId);
    fd.append("degree", form.degree);
    fd.append("university", form.university);
    fd.append("yearsExperience", form.yearsExperience || "");
    const specialtiesToSend =
      Array.isArray(form.specialties) && form.specialties.length
        ? form.specialties.join(",")
        : "";
    fd.append("specialties", specialtiesToSend);

    // servicios
    fd.append("mainWorkplace", form.mainWorkplace || "");
    fd.append("modalities", form.modalities || "");
    fd.append("website", form.website || "");
    fd.append("instagram", form.instagram || "");

    // archivos
    fd.append("certificate", files.certificate);
    if (files.cv) fd.append("cv", files.cv);

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/nutriologo/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // NO pongas Content-Type — fetch lo define para multipart
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json && json.msg ? json.msg : "Error del servidor";
        setError(msg);
      } else {
        setSuccess("Solicitud enviada correctamente. Te notificaremos cuando sea revisada.");
        setExistingRequest(json.request || { status: "pending", ...json.request });

        setForm({
          fullName: "",
          phone: "",
          city: "",
          notes: "",
          professionalId: "",
          degree: "",
          university: "",
          yearsExperience: "",
          specialties: [],          // <---- aquí como []
          mainWorkplace: "",
          modalities: "Presencial",
          website: "",
          instagram: "",
        });
        setFiles({ certificate: null, cv: null });
        setSpecialtyInput(""); 
      }
    } catch (err) {
      console.error(err);
      setError("Error al enviar la solicitud. Revisa la consola del servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Añadir una especialidad cuando presiona Enter o coma
const handleSpecialtyKeyDown = (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const val = specialtyInput.trim();
    if (!val) return;
    if (!form.specialties.includes(val)) {
      setForm((s) => ({ ...s, specialties: [...s.specialties, val] }));
    }
    setSpecialtyInput("");
  }
};

const removeSpecialty = (tag) => {
  setForm((s) => ({
    ...s,
    specialties: s.specialties.filter((t) => t !== tag),
  }));
};

  return (
    <main className="solicitud-nutriologo">
      <h1>Solicitud para convertirte en Nutriólogo</h1>

      <p className="lead">
        Comparte tu información profesional y adjunta tu documentación oficial.
        Un administrador revisará tu perfil y te notificará cuando la solicitud sea aprobada o rechazada.
      </p>

      {existingRequest ? (
        <div className="request-status">
          <h3>Solicitud existente</h3>
          <p>
            Estado: <strong>{existingRequest.status}</strong>
          </p>
          {existingRequest.adminNotes && (
            <p>Comentarios del administrador: {existingRequest.adminNotes}</p>
          )}
          <p>Enviada el: {new Date(existingRequest.createdAt).toLocaleString()}</p>
          {existingRequest.status === "rejected" && (
            <p className="hint">
              Si tu solicitud fue rechazada, corrige los datos o vuelve a enviar la documentación.
            </p>
          )}
        </div>
      ) : null}

      {!existingRequest || existingRequest.status === "rejected" ? (
        <form
          className="solicitud-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          {/* SECCIÓN: DATOS PERSONALES */}
          <div className="form-section">
            <h2 className="section-title">Datos personales</h2>
            <div className="form-row">
              <label>
                Nombre completo
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Ej. 3312345678"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Ciudad
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ej. Guadalajara, Jalisco"
                  required
                />
              </label>
            </div>
          </div>

          {/* SECCIÓN: INFORMACIÓN PROFESIONAL */}
          <div className="form-section">
            <h2 className="section-title">Información profesional</h2>

            <div className="form-row">
              <label>
                Cédula profesional
                <input
                  name="professionalId"
                  value={form.professionalId}
                  onChange={handleChange}
                  placeholder="Ej. 12345678"
                  required
                />
              </label>

              <label>
                Título / Grado
                <input
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  placeholder="Ej. Lic. en Nutrición"
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Universidad / Institución
                <input
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="Ej. Universidad de Guadalajara"
                  required
                />
              </label>

              <label>
                Años de experiencia
                <input
                  name="yearsExperience"
                  type="number"
                  min="0"
                  value={form.yearsExperience}
                  onChange={handleChange}
                  placeholder="Ej. 3"
                />
              </label>
            </div>

            <label>
              Áreas de especialidad
              <span className="help-text">
                Escribe y presiona <strong>Enter</strong> o <strong>,</strong> para añadir cada especialidad.
                Ej: nutrición deportiva, obesidad, diabetes, embarazo
              </span>

              <div className="tag-input">
                <div className="tag-list">
                  {form.specialties.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <button
                        type="button"
                        className="tag-pill-remove"
                        onClick={() => removeSpecialty(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  name="specialtyInput"
                  value={specialtyInput}
                  onChange={handleChange}
                  onKeyDown={handleSpecialtyKeyDown}
                  placeholder={
                    form.specialties.length === 0
                      ? "Ej. nutrición deportiva"
                      : "Escribe otra especialidad y presiona Enter"
                  }
                />
              </div>
            </label>

            <label>
              Notas adicionales (opcional)
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Comparte cualquier información relevante sobre tu práctica."
              />
            </label>
          </div>

          {/* SECCIÓN: SERVICIOS Y PRESENCIA */}
          <div className="form-section">
            <h2 className="section-title">Servicios y presencia profesional</h2>

            <div className="form-row">
              <label>
                Centro de trabajo principal (clínica, consultorio)
                <input
                  name="mainWorkplace"
                  value={form.mainWorkplace}
                  onChange={handleChange}
                  placeholder="Ej. VitalFlow Clinic, Tepic"
                />
              </label>

              <label>
                Modalidad de atención
                <select
                  name="modalities"
                  value={form.modalities}
                  onChange={handleChange}
                >
                  <option value="Presencial">Presencial</option>
                  <option value="En línea">En línea</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Sitio web (opcional)
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://tusitio.com"
                />
              </label>

              <label>
                Instagram profesional (opcional)
                <input
                  name="instagram"
                  value={form.instagram}
                  onChange={handleChange}
                  placeholder="@nutri.tuperfil"
                />
              </label>
            </div>
          </div>

          {/* ARCHIVOS */}
          <div className="form-section">
            <h2 className="section-title">Documentación</h2>
            <p className="help-text">
              Adjunta al menos un documento oficial que acredite tu formación (cédula, título, certificado).
            </p>

            <label>
              Certificado / Título (PDF/JPG/PNG) *
              <input
                type="file"
                name="certificate"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFile}
                required
              />
            </label>

            <label>
              CV (opcional)
              <input
                type="file"
                name="cv"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFile}
              />
            </label>
          </div>

          {error && <div className="vf-error">{error}</div>}
          {success && <div className="vf-success">{success}</div>}

          <div className="buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setForm({
                  fullName: "",
                  phone: "",
                  city: "",
                  notes: "",
                  professionalId: "",
                  degree: "",
                  university: "",
                  yearsExperience: "",
                  specialties: "",
                  mainWorkplace: "",
                  modalities: "Presencial",
                  website: "",
                  instagram: "",
                });
                setFiles({ certificate: null, cv: null });
                setError("");
                setSuccess("");
              }}
            >
              Limpiar
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
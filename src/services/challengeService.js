// src/services/challengeService.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL + "/api/challenges" || "http://localhost:4080/api/challenges";

// Listar retos (público o nutri, según backend)
export const listChallenges = (params) =>
  axios.get(`${API}`, { params }).then((r) => r.data);

// Obtener un reto por id
export const getChallenge = (id) =>
  axios.get(`${API}/${id}`).then((r) => r.data);

// Crear reto (nutriólogo / admin)
export const createChallenge = (token, body) =>
  axios
    .post(`${API}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Actualizar reto (nutriólogo / admin)
export const updateChallenge = (token, id, body) =>
  axios
    .put(`${API}/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Eliminar reto (nutriólogo / admin)
export const deleteChallenge = (token, id) =>
  axios
    .delete(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Unirse a un reto (usuario)
export const joinChallenge = (token, id) =>
  axios
    .post(
      `${API}/${id}/join`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Abandonar reto (usuario)
export const leaveChallenge = (token, id) =>
  axios
    .post(
      `${API}/${id}/leave`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Marcar día completado (usuario)
export const markChallenge = (token, id) =>
  axios
    .post(
      `${API}/${id}/mark`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((r) => r.data);

// Mis retos activos
export const myActive = (token) =>
  axios
    .get(`${API}/me/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Mis retos completados
export const myCompleted = (token) =>
  axios
    .get(`${API}/me/completed`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);
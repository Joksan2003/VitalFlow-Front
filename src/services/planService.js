// src/services/planService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL + "/api/plans" || "http://localhost:4080/api/plans";
const RECIPES_API = import.meta.env.VITE_API_URL + "/api/recipes" || "http://localhost:4080/api/recipes";

export const generarPlan = async (token) => {
  const res = await axios.post(
    `${API_URL}/generate`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const obtenerMiPlan = async (token) => {
  const res = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// endpoint que devolvía recetas del usuario (/api/recipes/me)
export const obtenerMisRecetas = async (token) => {
  const res = await axios.get(`${RECIPES_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerRecetasBulk = async (ids = [], token) => {
  const q = ids.join(',');
  const res = await axios.get(`${RECIPES_API}/bulk?ids=${encodeURIComponent(q)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};
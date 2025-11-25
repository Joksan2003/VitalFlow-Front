// src/services/favoriteService.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4080";

export async function getMyFavoriteRecipes(token) {
  const res = await axios.get(`${API}/api/recipes/favorites/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { ok, data: [...] }
}

export async function addFavorite(token, recipeId) {
  const res = await axios.post(
    `${API}/api/recipes/${recipeId}/favorite`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

export async function removeFavorite(token, recipeId) {
  const res = await axios.delete(`${API}/api/recipes/${recipeId}/favorite`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
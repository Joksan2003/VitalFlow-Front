// src/utils/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4080";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  // si hay token, lo mandamos
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    // que el error lleve el msg del backend si existe
    const err = new Error(data.msg || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// 👇 helpers nombrados
export function get(path, token) {
  return request(path, { method: "GET", token });
}

export function post(path, body, token) {
  return request(path, { method: "POST", body, token });
}

export function patch(path, body, token) {
  return request(path, { method: "PATCH", body, token });
}

export function del(path, token) {
  return request(path, { method: "DELETE", token });
}

// opcional: export default por si en algún lado lo usabas así
const api = { request, get, post, patch, del };
export default api;
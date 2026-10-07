// ─── src/api/client.js ───────────────────────────────────────────────────────
// Shared by both customer and hawker frontends.
// Copy this file into each frontend's src/api/ folder.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// ─── TOKEN STORAGE ────────────────────────────────────────────────────────────
export const tokenStore = {
  get:    ()    => localStorage.getItem("sgh_token"),
  set:    (tok) => localStorage.setItem("sgh_token", tok),
  clear:  ()    => localStorage.removeItem("sgh_token"),
};

// ─── BASE FETCH ───────────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const token = tokenStore.get();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // 401 → clear token (session expired)
  if (res.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event("sgh:auth:expired"));
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)         => apiFetch(path, { method:"GET" }),
  post:   (path, body)   => apiFetch(path, { method:"POST",   body }),
  patch:  (path, body)   => apiFetch(path, { method:"PATCH",  body }),
  put:    (path, body)   => apiFetch(path, { method:"PUT",    body }),
  delete: (path)         => apiFetch(path, { method:"DELETE" }),
};
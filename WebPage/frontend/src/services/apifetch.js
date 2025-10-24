// src/services/apiFetch.js
const API_BASE = "" // si más adelante quieres, pon "/api" y cambia las llamadas a endpoints sin el prefijo

export async function apiFetch(endpoint, { method = "GET", headers = {}, body, auth = true } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers }
  }

  // Añade el token automáticamente si existe y la llamada lo requiere
  const token = localStorage.getItem("token")
  if (auth && token) {
    opts.headers.Authorization = `Bearer ${token}`
  }

  // Serializa body si no viene como string
  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${endpoint}`, opts)

  // Intenta parsear JSON (puede no haber cuerpo)
  let data = null
  try { data = await res.json() } catch { /* sin cuerpo */ }

  if (!res.ok) {
    // Manejo básico de 401: limpiar token y redirigir a login
    if (res.status === 401 && auth) {
      localStorage.removeItem("token")
      // Redirige a login (marca query param para saber que expiró)
      window.location.href = "/login?expired=1"
    }
    const msg = data?.error || data?.mensaje || res.statusText || "Error en la petición"
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const api = {
  get: (url, opts) => apiFetch(url, { ...opts, method: "GET" }),
  post: (url, body, opts) => apiFetch(url, { ...opts, method: "POST", body }),
  put: (url, body, opts) => apiFetch(url, { ...opts, method: "PUT", body }),
  del: (url, opts) => apiFetch(url, { ...opts, method: "DELETE" })
}

// Utilidad opcional para leer el payload del JWT en frontend
export function getTokenPayload() {
  const token = localStorage.getItem("token")
  if (!token) return null
  try {
    const base64 = token.split(".")[1]
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
export function logout() {
  localStorage.removeItem("token")
}


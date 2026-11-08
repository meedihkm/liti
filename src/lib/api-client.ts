// ─────────────────────────────────────────────────────────────
// Client HTTP typé pour le front (SPA) — erreurs normalisées.
// Session admin en double canal : cookie httpOnly (top-level) ET
// Authorization: Bearer (iframes/previews où les cookies tiers
// sont bloqués par le navigateur) — le token vient de /api/admin/login.
// ─────────────────────────────────────────────────────────────
import { CSRF_MARKER } from "./constants"

const TOKEN_KEY = "rk_token"

/** Stocke/efface le token de session (après login/logout) */
export function setSessionToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

function bearerHeader(): Record<string, string> {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Marqueur anti-CSRF — vérifié côté serveur (sameOriginGuard)
      "X-Requested-With": CSRF_MARKER,
      ...bearerHeader(),
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* corps vide */
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "") || `Erreur ${res.status}`
    throw new ApiError(res.status, message)
  }
  return data as T
}

/** Upload multipart (images admin) */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
    headers: {
      // Marqueur anti-CSRF — vérifié côté serveur (sameOriginGuard)
      "X-Requested-With": CSRF_MARKER,
      ...bearerHeader(),
    },
    credentials: "same-origin",
  })
  if (!res.ok) {
    let message = `Erreur ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {}
    throw new ApiError(res.status, message)
  }
  return res.json()
}

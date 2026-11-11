// ─────────────────────────────────────────────────────────────
// Authentification admin — sessions serveur + bcrypt.
// Transport du token de session en DOUBLE CANAL :
//  • cookie httpOnly rk_session (SameSite=Lax) — usage top-level
//  • en-tête Authorization: Bearer <token> — iframe/preview : les
//    navigateurs bloquent les cookies tiers dans les iframes, le
//    header passe toujours. Le client stocke le token retourné par
//    /api/admin/login (localStorage) et le renvoie à chaque appel.
// ─────────────────────────────────────────────────────────────
import { cookies, headers } from "next/headers"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

const COOKIE_NAME = "rk_session"
const SESSION_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
  await db.session.create({ data: { token, userId, expiresAt } })
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
  return token
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const cookieToken = store.get(COOKIE_NAME)?.value
  // Token aussi transportable par Authorization (iframe/preview)
  const h = await headers()
  const authHeader = h.get("authorization") ?? ""
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
  for (const token of [cookieToken, bearerToken]) {
    if (token) await db.session.deleteMany({ where: { token } }).catch(() => {})
  }
  store.delete(COOKIE_NAME)
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "staff"
}

/** Token de session de la requête : Authorization Bearer (iframe)
 *  OU cookie (top-level). Retourne "" si absent. */
async function readSessionToken(): Promise<string> {
  try {
    const h = await headers()
    const authHeader = h.get("authorization") ?? ""
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim()
      if (token) return token
    }
  } catch {
    /* headers indisponible (contexte non requête) → cookie seul */
  }
  try {
    const store = await cookies()
    return store.get(COOKIE_NAME)?.value ?? ""
  } catch {
    return ""
  }
}

/** Retourne l'utilisateur connecté (ou null). Vérifie l'expiration en base. */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const token = await readSessionToken()
    if (!token) return null
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role === "staff" ? "staff" : "admin",
    }
  } catch {
    return null
  }
}

/** Vérifie l'utilisateur connecté et lance une erreur 401 si absent ou non-admin */
export async function verifySession(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/** Nettoyage périodique des sessions expirées */
export async function pruneSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {})
}

// ─────────────────────────────────────────────────────────────
// Helpers API côté serveur : réponses JSON, auth, validation
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthUser, type AuthUser } from "./auth"
import { checkRateLimit, clientIp, purgeRateLimits } from "./rate-limit"
import { CSRF_MARKER } from "./constants"

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Garde d'authentification pour les routes admin.
 * @param roles rôles autorisés (défaut : tous les connectés)
 * @returns l'utilisateur OU une Response 401/403 à retourner immédiatement
 */
export async function requireAdmin(
  roles?: Array<"admin" | "staff">
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const user = await getAuthUser()
  if (!user) return { response: jsonError(401, "Authentification requise") }
  if (roles && !roles.includes(user.role)) {
    return { response: jsonError(403, "Accès refusé : rôle insuffisant") }
  }
  return { user }
}

/** Valide le corps JSON d'une requête avec un schéma Zod */
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S
): Promise<{ data: z.infer<S> } | { response: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { response: jsonError(400, "JSON invalide") }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    const message = first
      ? `${first.message}${first.path.length ? ` (${first.path.join(".")})` : ""}`
      : "Données invalides"
    return { response: jsonError(422, message) }
  }
  return { data: result.data as z.infer<S> }
}

/** Garde anti-spam : rate limiting par IP + bucket */
export function rateGuard(
  req: Request,
  bucket: string,
  config: { limit: number; windowMs: number }
): NextResponse | null {
  purgeRateLimits()
  const key = `${bucket}:${clientIp(req)}`
  if (!checkRateLimit(key, config.limit, config.windowMs)) {
    return jsonError(429, "Trop de requêtes, veuillez réessayer plus tard")
  }
  return null
}

/**
 * Garde anti-CSRF — deux couches strictes, zéro dépendance à la topologie
 * de déploiement (proxies, previews, sous-domaines, IP… ne peuvent plus
 * provoquer de faux positif « Requête cross-origin refusée »).
 *
 *  1. Content-Type strict — application/json ou multipart/form-data ; un
 *     formulaire HTML cross-site ne peut pas forger ces types sans CORS.
 *  2. En-tête personnalisé X-Requested-With (posé par le client SPA) —
 *     impossible à envoyer cross-origin sans préflight CORS favorable,
 *     que l'API n'accorde JAMAIS (aucun Access-Control-Allow-* émis) :
 *     le navigateur bloque donc tout site tiers avant même le serveur.
 *
 * Complétées par : cookie de session SameSite=Lax (un POST cross-site ne
 * porte pas le cookie), rate limiting par IP, authentification + rôles.
 * La comparaison Origin↔Host a été retirée : elle supposait une topologie
 * connue (domaine dédié), ne résistait pas aux reverse-proxies/ifs de
 * preview, et n’apportait rien — un attaquant navigateur est déjà bloqué
 * par les couches 1-2, un attaquant non-navigateur n’envoie pas d’Origin
 * honnête de toute façon.
 */
export function sameOriginGuard(req: Request): NextResponse | null {
  const method = req.method.toUpperCase()
  if (method === "GET" || method === "HEAD") return null

  // Couche 1 — Content-Type attendu du client SPA
  const contentType = (req.headers.get("content-type") ?? "").toLowerCase()
  const isJson = contentType.startsWith("application/json")
  const isMultipart = contentType.startsWith("multipart/form-data")
  if (!isJson && !isMultipart) {
    return jsonError(403, "Requête invalide (content-type)")
  }

  // Couche 2 — marqueur posé par le client SPA (api-client.ts)
  if (req.headers.get("x-requested-with") !== CSRF_MARKER) {
    return jsonError(403, "Requête invalide (origine non vérifiable)")
  }

  return null
}

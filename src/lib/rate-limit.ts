// ─────────────────────────────────────────────────────────────
// Rate limiting en mémoire (protection checkout/contact/login)
// Simple compteur par clé (IP + bucket) avec fenêtre glissante.
// Suffisant pour un déploiement mono-instance ; remplacer par
// Redis si plusieurs instances (voir docs/ARCHITECTURE.md).
// ─────────────────────────────────────────────────────────────

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "local"
}

/**
 * @returns true si la requête est autorisée, false si la limite est atteinte
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count++
  return bucket.count <= limit
}

/** Purge périodique pour éviter les fuites mémoire */
export function purgeRateLimits(): void {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

// Limites appliquées
export const RATE_LIMITS = {
  checkout: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 commandes / 10 min / IP
  contact: { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 messages / 15 min / IP
  login: { limit: 15, windowMs: 10 * 60 * 1000 }, // 15 tentatives / 10 min / IP (marge tests & démo)
  track: { limit: 20, windowMs: 5 * 60 * 1000 },
  default: { limit: 30, windowMs: 5 * 60 * 1000 }, // 30 requêtes / 5 min / IP (API générale)
} as const

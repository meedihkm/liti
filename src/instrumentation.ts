// ─────────────────────────────────────────────────────────────
// Instrumentation Next.js — exécutée une fois au démarrage du
// serveur (dev ET production). Ici : auto-seed de la base si
// elle est vide, pour que le site et le login admin fonctionnent
// immédiatement après un reset d'environnement ou un premier
// `docker compose up` (voir src/lib/auto-seed.ts).
//
// Next compile ce fichier pour plusieurs runtimes (nodejs ET
// edge) : l'auto-seed (Prisma/SQLite/crypto) n'existe qu'en
// Node.js — d'où la garde NEXT_RUNTIME.
// ─────────────────────────────────────────────────────────────

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  try {
    const { ensureSeeded } = await import("./lib/auto-seed")
    await ensureSeeded()
  } catch (err) {
    console.error("⚠️ [instrumentation] auto-seed indisponible :", err)
  }
}

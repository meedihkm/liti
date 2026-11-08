// ─────────────────────────────────────────────────────────────
// Auto-seed : répare automatiquement une base vidée (reset de
// sandbox, premier démarrage) — vérifie une seule fois par
// process si des comptes existent ; sinon lance le seed complet.
// Singleton sur globalThis : survit au HMR du serveur de dev.
// Désactivable en production : SEED_DEMO="false" dans l'environnement.
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"

const g = globalThis as typeof globalThis & { __taqendurtSeed?: Promise<void> }

export function ensureSeeded(): Promise<void> {
  if (process.env.SEED_DEMO === "false") return Promise.resolve()
  if (!g.__taqendurtSeed) {
    g.__taqendurtSeed = (async () => {
      try {
        const users = await db.user.count()
        if (users > 0) return // base déjà peuplée → rien à faire
        console.log("🌱 [auto-seed] Base vide détectée — initialisation des données de démonstration…")
        const { runSeed } = await import("../../prisma/seed")
        await runSeed()
        console.log("✅ [auto-seed] Données restaurées (admin@taqendurt.dz / Admin!2026)")
      } catch (err) {
        // Ne casse jamais le démarrage : on log et on rend la main.
        // La base sera re-vérifiée au prochain redémarrage du serveur.
        g.__taqendurtSeed = undefined // permet une nouvelle tentative
        console.error("⚠️ [auto-seed] Échec :", err)
      }
    })()
  }
  return g.__taqendurtSeed
}

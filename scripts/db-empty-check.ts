// Vérifie si la base est vide (aucun utilisateur) — utilisé par
// docker-entrypoint.sh pour ne seed que les bases vierges.
// Code sortie 0 = vide (à seeder) · 1 = données présentes
import { db } from "@/lib/db"

async function main() {
  const users = await db.user.count()
  process.exit(users === 0 ? 0 : 1)
}

main().catch(() => process.exit(1))

// ─────────────────────────────────────────────────────────────
// Création / mise à jour du premier compte administrateur.
// Usage : bun scripts/create-admin.ts <email> <mot-de-passe> [nom] [rôle]
// Exemple : bun scripts/create-admin.ts amina@boutique.dz 'S3cret!' "Amina" admin
// Rôles : admin (tout) | staff (commandes + messages uniquement)
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

const [email, password, name = "Administrateur", role = "admin"] = process.argv.slice(2)

if (!email || !password) {
  console.error("Usage : bun scripts/create-admin.ts <email> <mot-de-passe> [nom] [rôle]")
  process.exit(1)
}
if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error("✗ Mot de passe trop faible : 8 caractères minimum, au moins une lettre et un chiffre.")
  process.exit(1)
}

async function main() {
  const passwordHash = await hashPassword(password)
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name, role },
    create: { email, passwordHash, name, role },
  })
  console.log(`✓ Compte enregistré : ${user.email} (${user.role})`)
}

main()
  .catch((e) => {
    console.error("✗", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

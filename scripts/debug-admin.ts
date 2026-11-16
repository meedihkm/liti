#!/usr/bin/env bun
// ─────────────────────────────────────────────────────────────
// Script de diagnostic admin
// Usage: bun scripts/debug-admin.ts
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"

async function debugAdmin() {
  console.log("🔍 Diagnostic du compte admin…\n")

  try {
    // 1. Vérifier tous les utilisateurs admin/staff
    const users = await db.user.findMany({
      where: {
        OR: [{ role: "admin" }, { role: "staff" }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    console.log("📋 Comptes admin/staff dans la base :")
    users.forEach((u) => {
      console.log(`  - ${u.email} (${u.role}) - ${u.name}`)
    })

    // 2. Tester le mot de passe pour chaque admin
    console.log("\n🔐 Test des mots de passe :")
    for (const user of users) {
      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        select: { email: true, passwordHash: true },
      })

      if (fullUser?.passwordHash) {
        const valid = await verifyPassword("Admin!2026", fullUser.passwordHash)
        console.log(
          `  - ${user.email} avec "Admin!2026" : ${valid ? "✅ VALIDE" : "❌ INVALIDE"}`
        )
      }
    }

    // 3. Vérifier les settings
    console.log("\n⚙️  Settings du site :")
    const settings = await db.siteSetting.findFirst()
    if (settings) {
      console.log(`  - Nom du site : ${settings.siteName}`)
      console.log(`  - Email contact : ${settings.email}`)
      console.log(`  - Email admin : ${settings.adminEmail}`)
    } else {
      console.log("  ⚠️  Aucun settings trouvé")
    }

    // 4. Vérifier les sessions actives
    const sessions = await db.session.count({
      where: {
        user: { role: { in: ["admin", "staff"] } },
      },
    })
    console.log(`\n🔑 Sessions admin actives : ${sessions}`)

    console.log("\n✅ Diagnostic terminé")
    console.log("\n💡 Pour vous connecter, utilisez :")
    if (users.length > 0) {
      const admin = users.find((u) => u.role === "admin")
      if (admin) {
        console.log(`   Email : ${admin.email}`)
        console.log(`   Mot de passe : Admin!2026`)
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic :", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

debugAdmin()

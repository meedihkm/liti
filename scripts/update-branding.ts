#!/usr/bin/env bun
// ─────────────────────────────────────────────────────────────
// Script pour mettre à jour le branding en production
// Usage: bun scripts/update-branding.ts
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"

async function updateBranding() {
  console.log("🦋 Mise à jour du branding vers Borboleta…")

  try {
    // 1. Mettre à jour les settings du site
    const settings = await db.siteSetting.findFirst()
    if (settings) {
      await db.siteSetting.update({
        where: { id: settings.id },
        data: {
          siteName: "Borboleta — Robes Kabyles",
          siteNameAr: "بوربوليتا — فساتين قبائلية",
          email: "contact@borboleta.dz",
          adminEmail: "admin@borboleta.dz",
        },
      })
      console.log("✓ Settings mis à jour")
    }

    // 2. Mettre à jour l'email admin (optionnel - garde l'ancien si vous préférez)
    const admin = await db.user.findFirst({
      where: { role: "admin" },
    })
    if (admin && admin.email === "admin@taqendurt.dz") {
      await db.user.update({
        where: { id: admin.id },
        data: { email: "admin@borboleta.dz" },
      })
      console.log("✓ Email admin mis à jour : admin@borboleta.dz")
      console.log("⚠️  Utilisez maintenant : admin@borboleta.dz / Admin!2026")
    } else if (admin) {
      console.log(`ℹ️  Email admin actuel : ${admin.email}`)
    }

    // 3. Mettre à jour l'email staff (optionnel)
    const staff = await db.user.findFirst({
      where: { role: "staff" },
    })
    if (staff && staff.email === "staff@taqendurt.dz") {
      await db.user.update({
        where: { id: staff.id },
        data: { email: "staff@borboleta.dz" },
      })
      console.log("✓ Email staff mis à jour : staff@borboleta.dz")
    }

    console.log("\n✅ Branding mis à jour avec succès !")
    console.log("\n📋 Nouveaux identifiants admin :")
    console.log("   Email : admin@borboleta.dz")
    console.log("   Mot de passe : Admin!2026")
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour :", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

updateBranding()

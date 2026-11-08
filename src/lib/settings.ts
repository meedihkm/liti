// ─────────────────────────────────────────────────────────────
// Paramètres du site (SiteSetting clé/valeur) — accès serveur
// ─────────────────────────────────────────────────────────────
import { db } from "@/lib/db"
import type { PublicSettings } from "./types"

export const DEFAULT_SETTINGS: PublicSettings & { adminEmail: string } = {
  siteName: "Taqendurt — Robes Kabyles",
  siteNameAr: "تاقندورث — أزياء قبائلية",
  tagline: "L'élégance amazigh, confectionnée pour vous",
  taglineAr: "أناقة أمازيغية تُخاط لأجلك",
  phone: "+213 550 12 34 56",
  whatsapp: "213550123456",
  email: "contact@taqendurt.dz",
  address: "Rue des Artisans, Tizi-Ouzou 15000, Algérie",
  addressAr: "شارع الصناع التقليديين، تيزي وزو 15000، الجزائر",
  instagram: "https://instagram.com/taqendurt",
  facebook: "https://facebook.com/taqendurt",
  tiktok: "https://tiktok.com/@taqendurt",
  heroTitle: "L'âme kabyle, taillée dans l'étoffe",
  heroTitleAr: "الروح القبائلية تُنسج من القماش",
  heroSubtitle:
    "Robes traditionnelles et modernes confectionnées à la main dans notre atelier de Tizi-Ouzou. Choisissez, personnalisez, nous cousons.",
  heroSubtitleAr:
    "فساتين تقليدية وعصرية تُخاط يدويًا في ورشتنا بتيزي وزو. اختر، خصّص، ونحن نخيط.",
  bannerText: "✨ Livraison dans les 58 wilayas — Sur-mesure offert pour toute commande de mariage",
  bannerTextAr: "✨ توصيل إلى 58 ولاية — الخياطة حسب القياس مجانية لطلبات الزفاف",
  bannerEnabled: true,
  adminEmail: "admin@taqendurt.dz",
}

export async function getSettings(): Promise<PublicSettings & { adminEmail: string }> {
  const merged = { ...DEFAULT_SETTINGS }
  try {
    const rows = await db.siteSetting.findMany()
    for (const row of rows) {
      if (row.key in merged) {
        const value = row.value
        // assignment dynamique contrôlée par les clés connues
        ;(merged as Record<string, unknown>)[row.key] =
          row.key === "bannerEnabled" ? value === "true" : value
      }
    }
  } catch {
    // base indisponible → valeurs par défaut
  }
  return merged
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const all = await getSettings()
  const { adminEmail: _admin, ...publicSettings } = all
  return publicSettings
}

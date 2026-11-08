// GET /api/meta — données de référence publiques (settings + catalogue d'options + frais livraison)
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api"
import { getPublicSettings } from "@/lib/settings"
import { WILAYAS } from "@/lib/constants"
import { ensureSeeded } from "@/lib/auto-seed"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  // Filet de sécurité : si la base a été vidée (reset sandbox), la
  // première visite de page la répare (singleton — coût nul ensuite).
  await ensureSeeded()

  const [settings, categories, fabrics, colors, embroideries, rates] = await Promise.all([
    getPublicSettings(),
    db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    db.fabric.findMany({ orderBy: { name: "asc" } }),
    db.color.findMany({ orderBy: { name: "asc" } }),
    db.embroideryOption.findMany({ orderBy: { name: "asc" } }),
    db.shippingRate.findMany({ where: { active: true } }),
  ])

  // Frais de livraison publics { wilayaCode → homePrice }
  const shippingRates: Record<string, number> = {}
  for (const r of rates) shippingRates[String(r.wilayaCode)] = r.homePrice
  void WILAYAS

  return jsonOk({
    settings,
    categories,
    fabrics,
    colors,
    embroideries,
    shippingRates,
  })
}

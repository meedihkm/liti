// Helpers partagés pour l'écriture du catalogue (POST/PUT produits)
// et les mappers DTO des options (tissus, couleurs, broderies, catégories).
import { type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError } from "@/lib/api"
import type {
  CategoryDTO,
  ColorDTO,
  ContactMessageDTO,
  EmbroideryDTO,
  FabricDTO,
  ShippingRateDTO,
} from "@/lib/types"
import { WILAYAS, DEFAULT_SHIPPING } from "@/lib/constants"

// ── Mappers DTO ───────────────────────────────────────────────

type FabricRow = { id: string; name: string; nameAr: string; image: string; priceExtra: number }
type ColorRow = { id: string; name: string; nameAr: string; hex: string }
type EmbroideryRow = { id: string; name: string; nameAr: string; priceExtra: number }
type CategoryRow = {
  id: string
  slug: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  image: string
  order: number
}
type MessageRow = {
  id: string
  name: string
  phone: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: Date
}

export function fabricDTO(f: FabricRow): FabricDTO {
  return { id: f.id, name: f.name, nameAr: f.nameAr, image: f.image, priceExtra: f.priceExtra }
}

export function colorDTO(c: ColorRow): ColorDTO {
  return { id: c.id, name: c.name, nameAr: c.nameAr, hex: c.hex }
}

export function embroideryDTO(e: EmbroideryRow): EmbroideryDTO {
  return { id: e.id, name: e.name, nameAr: e.nameAr, priceExtra: e.priceExtra }
}

export function categoryDTO(c: CategoryRow): CategoryDTO {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    nameAr: c.nameAr,
    description: c.description,
    descriptionAr: c.descriptionAr,
    image: c.image,
    order: c.order,
  }
}

export function messageDTO(m: MessageRow): ContactMessageDTO {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email,
    subject: m.subject,
    message: m.message,
    status: m.status === "handled" ? "handled" : m.status === "read" ? "read" : "new",
    createdAt: m.createdAt.toISOString(),
  }
}

/** Les 58 wilayas avec leur tarif (défaut si absent de la base) */
export function shippingRatesDTO(
  rates: { wilayaCode: number; homePrice: number; active: boolean }[]
): ShippingRateDTO[] {
  const byCode = new Map(rates.map((r) => [r.wilayaCode, r]))
  return WILAYAS.map((w) => {
    const r = byCode.get(w.code)
    return {
      wilayaCode: w.code,
      wilayaName: w.name,
      wilayaNameAr: w.nameAr,
      homePrice: r?.homePrice ?? DEFAULT_SHIPPING[w.code] ?? 600,
      active: r?.active ?? true,
    }
  })
}

// ── Validation des références produit ─────────────────────────

/** Valide les références (tissus/couleurs/broderies) d'un productUpsert. */
export async function validateProductRefs(input: {
  fabrics: { fabricId: string }[]
  colorIds: string[]
  embroideryIds: string[]
}): Promise<{ error: NextResponse } | { ok: true }> {
  const fabricIds = input.fabrics.map((f) => f.fabricId)
  if (new Set(fabricIds).size !== fabricIds.length) {
    return { error: jsonError(422, "Un même tissu est renseigné deux fois") }
  }
  if (new Set(input.colorIds).size !== input.colorIds.length) {
    return { error: jsonError(422, "Une même couleur est renseignée deux fois") }
  }
  if (new Set(input.embroideryIds).size !== input.embroideryIds.length) {
    return { error: jsonError(422, "Une même broderie est renseignée deux fois") }
  }

  const [fabrics, colors, embroideries] = await Promise.all([
    fabricIds.length
      ? db.fabric.findMany({ where: { id: { in: fabricIds } }, select: { id: true } })
      : [],
    input.colorIds.length
      ? db.color.findMany({ where: { id: { in: input.colorIds } }, select: { id: true } })
      : [],
    input.embroideryIds.length
      ? db.embroideryOption.findMany({
          where: { id: { in: input.embroideryIds } },
          select: { id: true },
        })
      : [],
  ])

  if (fabrics.length !== fabricIds.length) {
    return { error: jsonError(422, "Tissu inconnu") }
  }
  if (colors.length !== input.colorIds.length) {
    return { error: jsonError(422, "Couleur inconnue") }
  }
  if (embroideries.length !== input.embroideryIds.length) {
    return { error: jsonError(422, "Broderie inconnue") }
  }

  return { ok: true }
}

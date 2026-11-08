// ─────────────────────────────────────────────────────────────
// Helpers de sérialisation partagés par les routes API.
// Dossier privé (préfixe _) : n'est PAS exposé comme route.
// ─────────────────────────────────────────────────────────────
import type { Prisma } from "@prisma/client"
import type { OrderDTO, ProductDTO } from "@/lib/types"

// ── Produit ───────────────────────────────────────────────────

/** Include Prisma complet nécessaire à serializeProduct */
export const PRODUCT_INCLUDE = {
  category: { select: { id: true, slug: true, name: true, nameAr: true } },
  images: { orderBy: { order: "asc" } },
  fabrics: { include: { fabric: true } },
  colors: { include: { color: true } },
  embroideries: { include: { embroidery: true } },
} satisfies Prisma.ProductInclude

export type ProductFull = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

/** Parse sécurisé d'un JSON stocké en base (liste d'ids de couleurs) */
function parseColorIds(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

/**
 * Mappe un produit Prisma (avec relations) vers le ProductDTO du contrat :
 * dates ISO, images triées par `order`, fabrics avec productExtra RÉEL +
 * colorIds (JSON parsé, [] = toutes les couleurs du produit), category incluse.
 */
export function serializeProduct(p: ProductFull): ProductDTO {
  return {
    id: p.id,
    title: p.title,
    titleAr: p.titleAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    basePrice: p.basePrice,
    customSizeFee: p.customSizeFee,
    leadTimeDays: p.leadTimeDays,
    featured: p.featured,
    visible: p.visible,
    hasCustomLength: p.hasCustomLength,
    occasion: p.occasion,
    createdAt: p.createdAt.toISOString(),
    categoryId: p.categoryId,
    category: p.category
      ? { id: p.category.id, slug: p.category.slug, name: p.category.name, nameAr: p.category.nameAr }
      : undefined,
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      order: img.order,
    })),
    fabrics: p.fabrics.map((pf) => ({
      id: pf.fabric.id,
      name: pf.fabric.name,
      nameAr: pf.fabric.nameAr,
      image: pf.fabric.image,
      priceExtra: pf.fabric.priceExtra,
      productExtra: pf.priceExtra,
      colorIds: parseColorIds(pf.colorsJson),
    })),
    colors: p.colors.map((pc) => ({
      id: pc.color.id,
      name: pc.color.name,
      nameAr: pc.color.nameAr,
      hex: pc.color.hex,
    })),
    embroideries: p.embroideries.map((pe) => ({
      id: pe.embroidery.id,
      name: pe.embroidery.name,
      nameAr: pe.embroidery.nameAr,
      priceExtra: pe.embroidery.priceExtra,
    })),
  }
}

// ── Commande ──────────────────────────────────────────────────

/** Include Prisma complet nécessaire à serializeOrder (historique trié ASC) */
export const ORDER_INCLUDE = {
  items: true,
  history: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude

export type OrderFull = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>

/** Mappe une commande Prisma (avec items + history) vers l'OrderDTO du contrat. */
export function serializeOrder(o: OrderFull, opts: { hideAddress?: boolean } = {}): OrderDTO {
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    fullName: o.fullName,
    phone: o.phone,
    email: o.email,
    wilayaCode: o.wilayaCode,
    wilayaName: o.wilayaName,
    commune: o.commune,
    address: opts.hideAddress ? "" : o.address,
    deliveryMode: o.deliveryMode === "pickup" ? "pickup" : "home",
    shippingFee: o.shippingFee,
    subtotal: o.subtotal,
    total: o.total,
    note: o.note,
    internalNote: o.internalNote,
    refusalReason: o.refusalReason,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      productImage: it.productImage,
      fabricName: it.fabricName,
      colorName: it.colorName,
      colorHex: it.colorHex,
      embroideryJson: it.embroideryJson,
      size: it.size,
      measurementsJson: it.measurementsJson,
      length: it.length,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      note: it.note,
    })),
    history: o.history.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      actor: h.actor,
      createdAt: h.createdAt.toISOString(),
    })),
  }
}

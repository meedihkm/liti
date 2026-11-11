// POST /api/orders — création de commande (checkout public)
// Prix TOUJOURS recalculé serveur — aucune valeur de prix lue depuis le client.
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, rateGuard, sameOriginGuard } from "@/lib/api"
import { orderCreateSchema, type OrderCreateInput } from "@/lib/validators"
import { RATE_LIMITS } from "@/lib/rate-limit"
import { computeUnitPrice, computeOrderTotal } from "@/lib/pricing"
import {
  DEFAULT_SHIPPING,
  MEASUREMENT_FIELDS,
  STANDARD_SIZES,
  buildOrderNumber,
  wilayaByCode,
} from "@/lib/constants"
import { notifyNewOrder } from "@/lib/mailer"
import { PRODUCT_INCLUDE } from "../_lib/serialize"
import type { Prisma } from "@prisma/client"

interface PreparedItem {
  productId: string
  productName: string
  productImage: string
  fabricName: string
  colorName: string
  colorHex: string
  embroideryJson: string
  size: string
  measurementsJson: string
  length: string
  quantity: number
  unitPrice: number
  lineTotal: number
  note: string
}

function parseColorIds(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

/** Valide un item du panier contre le catalogue et calcule le prix autoritaire. */
async function prepareItem(
  it: OrderCreateInput["items"][number],
  index: number
): Promise<{ item: PreparedItem } | { error: NextResponse }> {
  const product = await db.product.findUnique({
    where: { id: it.productId },
    include: { ...PRODUCT_INCLUDE },
  })
  if (!product || !product.visible) {
    return { error: jsonError(404, `Produit introuvable (article ${index + 1})`) }
  }

  // 2. Tissu disponible sur ce produit → supplément RÉEL = ProductFabric.priceExtra
  const pf = product.fabrics.find((f) => f.fabricId === it.fabricId)
  if (!pf) {
    return { error: jsonError(422, `Tissu indisponible pour « ${product.title} »`) }
  }

  // 3. Couleur ∈ couleurs du produit ET (restrictions vides OU incluses)
  const pc = product.colors.find((c) => c.colorId === it.colorId)
  if (!pc) {
    return { error: jsonError(422, `Couleur indisponible pour « ${product.title} »`) }
  }
  const allowed = parseColorIds(pf.colorsJson)
  if (allowed.length > 0 && !allowed.includes(it.colorId)) {
    return { error: jsonError(422, "Combinaison tissu / couleur indisponible") }
  }

  // 4. Broderies ∈ broderies du produit
  const embroideryExtras: number[] = []
  const embroiderySnapshots: { name: string; nameAr: string; priceExtra: number }[] = []
  for (const embId of it.embroideryIds) {
    const pe = product.embroideries.find((e) => e.embroideryId === embId)
    if (!pe) {
      return { error: jsonError(422, `Broderie indisponible pour « ${product.title} »`) }
    }
    embroideryExtras.push(pe.embroidery.priceExtra)
    embroiderySnapshots.push({
      name: pe.embroidery.name,
      nameAr: pe.embroidery.nameAr,
      priceExtra: pe.embroidery.priceExtra,
    })
  }

  // 5. Taille standard ou sur-mesure (6 mesures dans les plages métier)
  const isCustom = it.size === "sur-mesure"
  if (!isCustom && !STANDARD_SIZES.includes(it.size as (typeof STANDARD_SIZES)[number])) {
    return { error: jsonError(422, `Taille invalide (S, M, L, XL, XXL ou sur-mesure)`) }
  }
  const measurements: Record<string, number> = {}
  if (isCustom) {
    const given = it.measurements ?? {}
    for (const field of MEASUREMENT_FIELDS) {
      const v = given[field.key]
      if (typeof v !== "number" || !Number.isFinite(v) || v < field.min || v > field.max) {
        return {
          error: jsonError(
            422,
            `Mesure « ${field.fr} » invalide (entre ${field.min} et ${field.max} cm)`
          ),
        }
      }
      measurements[field.key] = v
    }
  }

  // 6. Longueur réservée aux produits qui la proposent
  if (it.length && it.length.trim() !== "" && !product.hasCustomLength) {
    return { error: jsonError(422, `« ${product.title} » ne propose pas de longueur personnalisable`) }
  }

  // 7. Prix unitaire autoritaire
  const unitPrice = computeUnitPrice({
    basePrice: product.basePrice,
    fabricExtra: pf.priceExtra,
    embroideryExtras,
    isCustomSize: isCustom,
    customSizeFee: product.customSizeFee,
  })

  // Note d'article : la date d'événement est conservée dans le snapshot (pas de colonne dédiée)
  let note = it.note?.trim() ?? ""
  if (it.eventDate) {
    note = note ? `${note} — Événement le ${it.eventDate}` : `Événement le ${it.eventDate}`
  }

  return {
    item: {
      productId: product.id,
      productName: product.title,
      productImage: product.images[0]?.url ?? "",
      fabricName: pf.fabric.name,
      colorName: pc.color.name,
      colorHex: pc.color.hex,
      embroideryJson: JSON.stringify(embroiderySnapshots),
      size: it.size,
      measurementsJson: JSON.stringify(measurements),
      length: it.length?.trim() ?? "",
      quantity: it.quantity,
      unitPrice,
      lineTotal: unitPrice * it.quantity,
      note,
    },
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const limited = rateGuard(req, "checkout", RATE_LIMITS.checkout)
  if (limited) return limited

  const parsed = await parseBody(req, orderCreateSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data
  // (honeypot `website` garanti vide par le schéma Zod)

  // ── Validation + calcul autoritaire de chaque ligne ─────────
  const prepared: PreparedItem[] = []
  for (let i = 0; i < data.items.length; i++) {
    const res = await prepareItem(data.items[i], i)
    if ("error" in res) return res.error
    prepared.push(res.item)
  }

  // ── Frais de livraison (pickup → 0 ; home → grille active ou défaut) ──
  let shippingFee = 0
  if (data.customer.deliveryMode === "home") {
    const rate = await db.shippingRate.findUnique({
      where: { wilayaCode: data.customer.wilayaCode },
    })
    shippingFee =
      rate && rate.active ? rate.homePrice : (DEFAULT_SHIPPING[data.customer.wilayaCode] ?? 600)
  }

  const { subtotal, total } = computeOrderTotal(prepared, shippingFee)

  // ── Numéro séquentiel : RK-{année}-{seq 4 chiffres} ──────────
  const year = new Date().getFullYear()
  const prefix = `RK-${year}-`
  const count = await db.order.count({ where: { number: { startsWith: prefix } } })
  let seq = count + 1
  let number = buildOrderNumber(seq, year)
  // Sécurité anti-collision (unicité) en cas d'appels concurrents
  while (await db.order.findUnique({ where: { number } })) {
    seq += 1
    number = buildOrderNumber(seq, year)
  }

  const wilaya = wilayaByCode(data.customer.wilayaCode)

  const order = await db.order.create({
    data: {
      number,
      status: "pending",
      fullName: data.customer.fullName.trim(),
      phone: data.customer.phone,
      email: data.customer.email ?? "",
      wilayaCode: data.customer.wilayaCode,
      wilayaName: wilaya?.name ?? String(data.customer.wilayaCode),
      commune: data.customer.commune.trim(),
      address: data.customer.address?.trim() ?? "",
      deliveryMode: data.customer.deliveryMode,
      shippingFee,
      subtotal,
      total,
      note: data.customer.note?.trim() ?? "",
      items: {
        create: prepared as db.OrderItemCreateWithoutOrderInput[],
      },
      history: {
        create: { status: "pending", note: "Commande reçue", actor: "system" },
      },
    },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  })

  // Notification admin (non bloquante — email journalisé si SMTP absent)
  await notifyNewOrder(order.number, order.total, order.fullName).catch(() => {})

  return jsonOk(
    {
      number: order.number,
      total: order.total,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      itemCount: order.items.reduce((sum, it) => sum + it.quantity, 0),
    },
    201
  )
}

// /api/admin/orders/:id — GET (détail) / PATCH (statut) / PUT (édition avant validation) — staff OK
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { orderUpdateSchema, orderEditSchema } from "@/lib/validators"
import { serializeOrder, ORDER_INCLUDE } from "../../../_lib/serialize"

export const dynamic = "force-dynamic"

/** Recherche par id OU par numéro de commande (insensible à la casse) */
async function findOrder(idOrNumber: string) {
  const order = await db.order.findUnique({
    where: { id: idOrNumber },
    include: { items: true },
  })
  if (order) return order
  return db.order.findFirst({
    where: { number: { in: [idOrNumber, idOrNumber.toUpperCase()] } },
    include: { items: true },
  })
}

// ── GET : détail complet (items + historique ASC) ─────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const { id } = await params
  const order = await findOrder(id)
  if (!order) return jsonError(404, "Commande introuvable")

  const full = await db.order.findUnique({ where: { id: order.id }, include: ORDER_INCLUDE })
  return jsonOk(serializeOrder(full!))
}

// ── PATCH : changement de statut + historique ─────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const { id } = await params
  const order = await findOrder(id)
  if (!order) return jsonError(404, "Commande introuvable")

  const parsed = await parseBody(req, orderUpdateSchema)
  if ("response" in parsed) return parsed.response
  const { status, note, refusalReason, internalNote } = parsed.data

  // Motif obligatoire pour un refus
  if (status === "refused" && !(refusalReason ?? "").trim()) {
    return jsonError(422, "Le motif de refus est obligatoire pour refuser une commande")
  }

  const statusChanged = Boolean(status) && status !== order.status

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      ...(status ? { status } : {}),
      ...(refusalReason !== undefined ? { refusalReason } : {}),
      ...(internalNote !== undefined ? { internalNote } : {}),
      ...(statusChanged
        ? {
            history: {
              create: {
                status: status!,
                note:
                  note?.trim() ??
                  (status === "refused" ? (refusalReason ?? "").trim() : ""),
                actor: auth.user.name,
              },
            },
          }
        : {}),
    },
    include: ORDER_INCLUDE,
  })

  return jsonOk(serializeOrder(updated))
}

// ── PUT : modification avant validation (statut pending uniquement) ──
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const { id } = await params
  const order = await findOrder(id)
  if (!order) return jsonError(404, "Commande introuvable")

  if (order.status !== "pending") {
    return jsonError(409, "Seules les commandes en attente peuvent être modifiées")
  }

  const parsed = await parseBody(req, orderEditSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  // Quantités des items (recalcul des lineTotal)
  if (data.items && data.items.length > 0) {
    for (const line of data.items) {
      const item = order.items.find((it) => it.id === line.id)
      if (!item) {
        return jsonError(422, "Article inconnu dans cette commande")
      }
      await db.orderItem.update({
        where: { id: line.id },
        data: { quantity: line.quantity, lineTotal: item.unitPrice * line.quantity },
      })
    }
  }

  // Frais de livraison : explicite > implicite (pickup → 0) > inchangé
  let shippingFee = order.shippingFee
  if (data.shippingFee !== undefined) {
    shippingFee = data.shippingFee
  } else if (data.deliveryMode === "pickup") {
    shippingFee = 0
  }

  // Recalcul autoritaire du sous-total et du total
  const freshItems = await db.orderItem.findMany({ where: { orderId: order.id } })
  const subtotal = freshItems.reduce((sum, it) => sum + it.lineTotal, 0)
  const total = subtotal + shippingFee

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.commune !== undefined ? { commune: data.commune.trim() } : {}),
      ...(data.address !== undefined ? { address: data.address.trim() } : {}),
      ...(data.deliveryMode !== undefined ? { deliveryMode: data.deliveryMode } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(data.internalNote !== undefined ? { internalNote: data.internalNote } : {}),
      shippingFee,
      subtotal,
      total,
    },
    include: ORDER_INCLUDE,
  })

  return jsonOk(serializeOrder(updated))
}

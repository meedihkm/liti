// GET /api/track?number=RK-…&phone=… — suivi de commande par le client
// Numéro insensible à la casse, téléphone comparé sur les 9 derniers chiffres.
// Jamais l'adresse exacte (uniquement wilaya + commune).
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, rateGuard } from "@/lib/api"
import { RATE_LIMITS } from "@/lib/rate-limit"
import { serializeOrder } from "../_lib/serialize"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = rateGuard(req, "track", RATE_LIMITS.track)
  if (limited) return limited

  const number = req.nextUrl.searchParams.get("number")?.trim() ?? ""
  const phone = req.nextUrl.searchParams.get("phone")?.replace(/\D/g, "") ?? ""

  if (!number || !phone) {
    return jsonError(400, "Numéro de commande et téléphone requis")
  }
  if (phone.length < 9) {
    return jsonError(400, "Numéro de téléphone invalide")
  }

  // Insensible à la casse : le numéro est stocké en majuscules (RK-2026-0001)
  const order = await db.order.findFirst({
    where: { number: { in: [number, number.toUpperCase(), number.toLowerCase()] } },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  })

  if (!order) {
    return jsonError(404, "Commande introuvable")
  }

  // Téléphone : comparaison sur les 9 derniers chiffres (0/+213 normalisés)
  const orderPhone = order.phone.replace(/\D/g, "").slice(-9)
  if (orderPhone !== phone.slice(-9)) {
    return jsonError(404, "Commande introuvable")
  }

  // DTO complet mais SANS l'adresse exacte
  return jsonOk(serializeOrder(order, { hideAddress: true }))
}

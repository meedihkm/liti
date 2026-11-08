// /api/admin/shipping — GET (58 tarifs avec noms wilayas) / PUT (upsert bulk) — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { shippingBulkSchema } from "@/lib/validators"
import { shippingRatesDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const rates = await db.shippingRate.findMany({ orderBy: { wilayaCode: "asc" } })
  return jsonOk({ rates: shippingRatesDTO(rates) })
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, shippingBulkSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  if (data.length === 0) {
    return jsonError(422, "Aucun tarif fourni")
  }

  for (const rate of data) {
    await db.shippingRate.upsert({
      where: { wilayaCode: rate.wilayaCode },
      update: { homePrice: rate.homePrice, active: rate.active },
      create: {
        wilayaCode: rate.wilayaCode,
        homePrice: rate.homePrice,
        active: rate.active,
      },
    })
  }

  return jsonOk({ ok: true })
}

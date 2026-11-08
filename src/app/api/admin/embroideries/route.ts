// /api/admin/embroideries — GET (toutes) / POST — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { embroiderySchema } from "@/lib/validators"
import { embroideryDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const embroideries = await db.embroideryOption.findMany({ orderBy: { name: "asc" } })
  return jsonOk({ embroideries: embroideries.map(embroideryDTO) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, embroiderySchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const embroidery = await db.embroideryOption.create({
    data: {
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      priceExtra: data.priceExtra ?? 0,
    },
  })

  return jsonOk(embroideryDTO(embroidery), 201)
}

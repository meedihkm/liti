// /api/admin/fabrics — GET (tous) / POST — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { fabricSchema } from "@/lib/validators"
import { fabricDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const fabrics = await db.fabric.findMany({ orderBy: { name: "asc" } })
  return jsonOk({ fabrics: fabrics.map(fabricDTO) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, fabricSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const fabric = await db.fabric.create({
    data: {
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      image: data.image ?? "",
      priceExtra: data.priceExtra ?? 0,
    },
  })

  return jsonOk(fabricDTO(fabric), 201)
}

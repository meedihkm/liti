// /api/admin/colors — GET (toutes) / POST — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { colorSchema } from "@/lib/validators"
import { colorDTO } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const colors = await db.color.findMany({ orderBy: { name: "asc" } })
  return jsonOk({ colors: colors.map(colorDTO) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, colorSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const color = await db.color.create({
    data: { name: data.name.trim(), nameAr: data.nameAr.trim(), hex: data.hex.toLowerCase() },
  })

  return jsonOk(colorDTO(color), 201)
}

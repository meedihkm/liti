// /api/admin/colors/:id — PUT / DELETE — admin (DELETE refusé si produits liés)
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { colorSchema } from "@/lib/validators"
import { colorDTO } from "../../../_lib/catalog"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const color = await db.color.findUnique({ where: { id } })
  if (!color) return jsonError(404, "Couleur introuvable")

  const parsed = await parseBody(req, colorSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const updated = await db.color.update({
    where: { id },
    data: { name: data.name.trim(), nameAr: data.nameAr.trim(), hex: data.hex.toLowerCase() },
  })

  return jsonOk(colorDTO(updated))
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const color = await db.color.findUnique({ where: { id } })
  if (!color) return jsonError(404, "Couleur introuvable")

  const linked = await db.productColor.count({ where: { colorId: id } })
  if (linked > 0) {
    return jsonError(409, "Impossible de supprimer : cette couleur est utilisée par des produits")
  }

  await db.color.delete({ where: { id } })
  return jsonOk({ ok: true })
}

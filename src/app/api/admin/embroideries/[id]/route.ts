// /api/admin/embroideries/:id — PUT / DELETE — admin (DELETE refusé si produits liés)
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { embroiderySchema } from "@/lib/validators"
import { embroideryDTO } from "../../../_lib/catalog"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const embroidery = await db.embroideryOption.findUnique({ where: { id } })
  if (!embroidery) return jsonError(404, "Broderie introuvable")

  const parsed = await parseBody(req, embroiderySchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const updated = await db.embroideryOption.update({
    where: { id },
    data: {
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      priceExtra: data.priceExtra ?? 0,
    },
  })

  return jsonOk(embroideryDTO(updated))
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
  const embroidery = await db.embroideryOption.findUnique({ where: { id } })
  if (!embroidery) return jsonError(404, "Broderie introuvable")

  const linked = await db.productEmbroidery.count({ where: { embroideryId: id } })
  if (linked > 0) {
    return jsonError(409, "Impossible de supprimer : cette broderie est utilisée par des produits")
  }

  await db.embroideryOption.delete({ where: { id } })
  return jsonOk({ ok: true })
}

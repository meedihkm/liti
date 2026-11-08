// /api/admin/fabrics/:id — PUT / DELETE — admin (DELETE refusé si produits liés)
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { fabricSchema } from "@/lib/validators"
import { fabricDTO } from "../../../_lib/catalog"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const fabric = await db.fabric.findUnique({ where: { id } })
  if (!fabric) return jsonError(404, "Tissu introuvable")

  const parsed = await parseBody(req, fabricSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const updated = await db.fabric.update({
    where: { id },
    data: {
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      image: data.image ?? "",
      priceExtra: data.priceExtra ?? 0,
    },
  })

  return jsonOk(fabricDTO(updated))
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
  const fabric = await db.fabric.findUnique({ where: { id } })
  if (!fabric) return jsonError(404, "Tissu introuvable")

  const linked = await db.productFabric.count({ where: { fabricId: id } })
  if (linked > 0) {
    return jsonError(409, "Impossible de supprimer : ce tissu est utilisé par des produits")
  }

  await db.fabric.delete({ where: { id } })
  return jsonOk({ ok: true })
}

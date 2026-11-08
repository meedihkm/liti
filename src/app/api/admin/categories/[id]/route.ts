// /api/admin/categories/:id — PUT / DELETE — admin
// DELETE refusé (409) si des produits sont liés ; le slug reste stable en PUT.
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { categorySchema } from "@/lib/validators"
import { categoryDTO } from "../../../_lib/catalog"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const category = await db.category.findUnique({ where: { id } })
  if (!category) return jsonError(404, "Catégorie introuvable")

  const parsed = await parseBody(req, categorySchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const updated = await db.category.update({
    where: { id },
    data: {
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      description: data.description ?? "",
      descriptionAr: data.descriptionAr ?? "",
      image: data.image ?? "",
      order: data.order ?? 0,
    },
  })

  return jsonOk(categoryDTO(updated))
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
  const category = await db.category.findUnique({ where: { id } })
  if (!category) return jsonError(404, "Catégorie introuvable")

  const linked = await db.product.count({ where: { categoryId: id } })
  if (linked > 0) {
    return jsonError(
      409,
      "Impossible de supprimer : des produits sont liés à cette catégorie"
    )
  }

  await db.category.delete({ where: { id } })
  return jsonOk({ ok: true })
}

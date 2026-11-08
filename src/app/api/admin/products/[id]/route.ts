// /api/admin/products/:id — GET / PUT (remplacement intégral) / DELETE — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { productUpsertSchema, type ProductUpsertInput } from "@/lib/validators"
import { PRODUCT_INCLUDE, serializeProduct } from "../../../_lib/serialize"
import { validateProductRefs } from "../../../_lib/catalog"

export const dynamic = "force-dynamic"

// ── GET : détail (y compris masqué) ────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const product = await db.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE })
  if (!product) return jsonError(404, "Produit introuvable")

  return jsonOk(serializeProduct(product))
}

// ── PUT : remplacement intégral des champs + relations ─────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return jsonError(404, "Produit introuvable")

  const parsed = await parseBody(req, productUpsertSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const category = await db.category.findUnique({ where: { id: data.categoryId } })
  if (!category) return jsonError(422, "Catégorie introuvable")

  const refs = await validateProductRefs(data)
  if ("error" in refs) return refs.error

  const updated = await db.product.update({
    where: { id },
    data: {
      title: data.title.trim(),
      titleAr: data.titleAr.trim(),
      description: data.description ?? "",
      descriptionAr: data.descriptionAr ?? "",
      basePrice: data.basePrice,
      customSizeFee: data.customSizeFee ?? 1500,
      leadTimeDays: data.leadTimeDays ?? 14,
      featured: data.featured ?? false,
      visible: data.visible ?? true,
      hasCustomLength: data.hasCustomLength ?? false,
      occasion: data.occasion ?? "",
      categoryId: data.categoryId,
      // Remplacement intégral des relations
      images: {
        deleteMany: {},
        create: data.images.map((img, index) => ({
          url: img.url,
          alt: img.alt ?? "",
          order: index,
        })),
      },
      fabrics: {
        deleteMany: {},
        create: data.fabrics.map((f) => ({
          fabricId: f.fabricId,
          priceExtra: f.priceExtra,
          colorsJson: JSON.stringify(f.colorIds ?? []),
        })),
      },
      colors: { deleteMany: {}, create: data.colorIds.map((colorId) => ({ colorId })) },
      embroideries: {
        deleteMany: {},
        create: data.embroideryIds.map((embroideryId) => ({ embroideryId })),
      },
    },
    include: PRODUCT_INCLUDE,
  })

  return jsonOk(serializeProduct(updated))
}

// ── DELETE : les OrderItem conservent leur snapshot (aucune FK) ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return jsonError(404, "Produit introuvable")

  await db.product.delete({ where: { id } })
  return jsonOk({ ok: true })
}

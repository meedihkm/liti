// /api/admin/products — GET (tous, y compris masqués) / POST (création) — admin
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk, parseBody, sameOriginGuard, requireAdmin } from "@/lib/api"
import { productUpsertSchema, type ProductUpsertInput } from "@/lib/validators"
import { PRODUCT_INCLUDE, serializeProduct } from "../../_lib/serialize"
import { validateProductRefs } from "../../_lib/catalog"

export const dynamic = "force-dynamic"

/** Données relationnelles imbriquées (images ordonnées par index) */
function relationsData(data: ProductUpsertInput) {
  return {
    images: {
      create: data.images.map((img, index) => ({
        url: img.url,
        alt: img.alt ?? "",
        order: index,
      })),
    },
    fabrics: {
      create: data.fabrics.map((f) => ({
        fabricId: f.fabricId,
        priceExtra: f.priceExtra,
        colorsJson: JSON.stringify(f.colorIds ?? []),
      })),
    },
    colors: { create: data.colorIds.map((colorId) => ({ colorId })) },
    embroideries: { create: data.embroideryIds.map((embroideryId) => ({ embroideryId })) },
  }
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const products = await db.product.findMany({
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  return jsonOk({ products: products.map(serializeProduct) })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = sameOriginGuard(req)
  if (origin) return origin
  const auth = await requireAdmin(["admin"])
  if ("response" in auth) return auth.response

  const parsed = await parseBody(req, productUpsertSchema)
  if ("response" in parsed) return parsed.response
  const data = parsed.data

  const category = await db.category.findUnique({ where: { id: data.categoryId } })
  if (!category) return jsonError(422, "Catégorie introuvable")

  const refs = await validateProductRefs(data)
  if ("error" in refs) return refs.error

  const product = await db.product.create({
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
      ...relationsData(data),
    },
    include: PRODUCT_INCLUDE,
  })

  return jsonOk(serializeProduct(product), 201)
}

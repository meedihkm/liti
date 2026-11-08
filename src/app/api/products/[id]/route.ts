// GET /api/products/:id — détail d'un produit visible (404 si absent ou masqué)
import { NextRequest, type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/api"
import { PRODUCT_INCLUDE, serializeProduct } from "../../_lib/serialize"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  })

  if (!product || !product.visible) {
    return jsonError(404, "Produit introuvable")
  }

  return jsonOk(serializeProduct(product))
}

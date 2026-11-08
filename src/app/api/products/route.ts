// GET /api/products — liste paginée + filtres combinés (AND), produits visibles uniquement
import { NextRequest, type NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/api"
import { PRODUCT_INCLUDE, serializeProduct } from "../_lib/serialize"

export const dynamic = "force-dynamic"

const SORTS = new Set(["newest", "price-asc", "price-desc", "featured"])

function parseIntOr(v: string | null, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams

  const limit = Math.min(Math.max(parseIntOr(sp.get("limit"), 12), 1), 24)
  const page = Math.max(parseIntOr(sp.get("page"), 1), 1)
  const category = sp.get("category")?.trim() || ""
  const fabric = sp.get("fabric")?.trim() || ""
  const color = sp.get("color")?.trim() || ""
  const occasion = sp.get("occasion")?.trim() || ""
  const featured = sp.get("featured")?.trim() || ""
  const min = Number.parseInt(sp.get("min") ?? "", 10)
  const max = Number.parseInt(sp.get("max") ?? "", 10)
  const sort = sp.get("sort")?.trim() || "newest"

  // ── Filtres (combinés en AND) ───────────────────────────────
  const where: Prisma.ProductWhereInput = { visible: true }
  if (category) where.category = { slug: category }
  if (fabric) where.fabrics = { some: { fabricId: fabric } }
  if (color) where.colors = { some: { colorId: color } }
  if (occasion) where.occasion = occasion
  if (featured === "true") where.featured = true
  const price: Prisma.IntFilter = {}
  if (Number.isFinite(min) && min >= 0) price.gte = min
  if (Number.isFinite(max) && max >= 0) price.lte = max
  if (price.gte !== undefined || price.lte !== undefined) where.basePrice = price

  // ── Tri ─────────────────────────────────────────────────────
  let orderBy: Prisma.ProductOrderByWithRelationInput[]
  switch (sort) {
    case "price-asc":
      orderBy = [{ basePrice: "asc" }, { createdAt: "desc" }]
      break
    case "price-desc":
      orderBy = [{ basePrice: "desc" }, { createdAt: "desc" }]
      break
    case "featured":
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }]
      break
    default:
      if (!SORTS.has(sort)) {
        return jsonError(400, "Tri invalide (newest, price-asc, price-desc, featured)")
      }
      orderBy = [{ createdAt: "desc" }]
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const pages = Math.max(Math.ceil(total / limit), 1)
  return jsonOk({
    products: products.map(serializeProduct),
    total,
    page,
    pages,
  })
}

// GET /api/admin/orders — liste filtrée/paginée des commandes (staff OK)
// ?format=csv → export CSV (BOM UTF-8, séparateur « ; » friendly Excel FR)
import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { jsonError, jsonOk, requireAdmin } from "@/lib/api"
import { ORDER_STATUSES } from "@/lib/constants"
import { serializeOrder } from "../../_lib/serialize"

export const dynamic = "force-dynamic"

function parseIntOr(v: string | null, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Échappe une valeur CSV (guillemets, séparateur, retours à la ligne) */
function csvEscape(value: string): string {
  if (/[";\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function csvDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin() // staff OK
  if ("response" in auth) return auth.response

  const sp = req.nextUrl.searchParams
  const status = sp.get("status")?.trim() || ""
  const q = sp.get("q")?.trim() || ""
  const wilaya = sp.get("wilaya")?.trim() || ""
  const format = sp.get("format")?.trim().toLowerCase() || ""
  const sort = sp.get("sort")?.trim() || "recent"
  const page = Math.max(parseIntOr(sp.get("page"), 1), 1)
  const pageSize = Math.min(Math.max(parseIntOr(sp.get("pageSize"), 20), 1), 100)

  // ── Filtres ─────────────────────────────────────────────────
  const where: Prisma.OrderWhereInput = {}
  if (status) {
    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return jsonError(400, "Statut invalide")
    }
    where.status = status
  }
  if (q) {
    where.OR = [
      { number: { contains: q } },
      { fullName: { contains: q } },
      { phone: { contains: q } },
    ]
  }
  const wilayaCode = Number.parseInt(wilaya, 10)
  if (Number.isFinite(wilayaCode) && wilayaCode >= 1 && wilayaCode <= 58) {
    where.wilayaCode = wilayaCode
  }

  // ── Tri ─────────────────────────────────────────────────────
  let orderBy: Prisma.OrderOrderByWithRelationInput[]
  switch (sort) {
    case "total-asc":
      orderBy = [{ total: "asc" }, { createdAt: "desc" }]
      break
    case "total-desc":
      orderBy = [{ total: "desc" }, { createdAt: "desc" }]
      break
    case "recent":
      orderBy = [{ createdAt: "desc" }]
      break
    default:
      return jsonError(400, "Tri invalide (recent, total-asc, total-desc)")
  }

  // ── Export CSV ──────────────────────────────────────────────
  if (format === "csv") {
    const orders = await db.order.findMany({ where, orderBy, include: { items: true } })
    const header = [
      "number",
      "createdAt",
      "fullName",
      "phone",
      "wilayaName",
      "commune",
      "deliveryMode",
      "status",
      "subtotal",
      "shippingFee",
      "total",
      "articles",
    ]
    const rows = orders.map((o) => [
      o.number,
      csvDate(o.createdAt),
      o.fullName,
      o.phone,
      o.wilayaName,
      o.commune,
      o.deliveryMode,
      o.status,
      String(o.subtotal),
      String(o.shippingFee),
      String(o.total),
      o.items.map((it) => `${it.productName} ×${it.quantity}`).join(" | "),
    ])
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(";")).join("\r\n")
    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="commandes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy,
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const pages = Math.max(Math.ceil(total / pageSize), 1)
  return jsonOk({
    orders: orders.map((o) => serializeOrder(o)),
    total,
    page,
    pages,
  })
}

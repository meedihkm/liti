// GET /api/admin/stats — tableau de bord (staff OK)
import { type NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, requireAdmin } from "@/lib/api"

export const dynamic = "force-dynamic"

const REVENUE_STATUSES = ["validated", "crafting", "ready", "shipped", "delivered"]

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin()
  if ("response" in auth) return auth.response

  const now = new Date()
  const since48h = new Date(now.getTime() - 48 * 3600 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [newOrders, pendingOrders, totalOrders, unreadMessages, monthAgg, topAgg, recentOrders] =
    await Promise.all([
      db.order.count({ where: { createdAt: { gte: since48h } } }),
      db.order.count({ where: { status: "pending" } }),
      db.order.count(),
      db.contactMessage.count({ where: { status: "new" } }),
      db.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { in: REVENUE_STATUSES } },
        _sum: { total: true },
      }),
      db.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ])

  return jsonOk({
    newOrders,
    pendingOrders,
    monthRevenue: monthAgg._sum.total ?? 0,
    totalOrders,
    unreadMessages,
    topProducts: topAgg.map((t) => ({ name: t.productName, count: t._sum.quantity ?? 0 })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      number: o.number,
      fullName: o.fullName,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  })
}

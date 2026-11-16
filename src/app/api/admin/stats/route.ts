import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import type { AdminStatsDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats → AdminStatsDTO
 * Statistiques pour le tableau de bord admin (staff OK).
 * Contrat: docs/API_CONTRACT.md
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    // Premier jour du mois courant
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const validatedStatuses = ["validated", "crafting", "ready", "shipped", "delivered"];

    // Paralléliser toutes les requêtes
    const [
      newOrders,
      pendingOrders,
      monthRevenue,
      totalOrders,
      unreadMessages,
      topProductsRaw,
      recentOrders,
    ] = await Promise.all([
      // Nouvelles commandes (48h)
      db.order.count({ where: { createdAt: { gte: twoDaysAgo } } }),

      // Commandes en attente
      db.order.count({ where: { status: "pending" } }),

      // Revenu du mois courant (statuts validés uniquement)
      db.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: monthStart },
          status: { in: validatedStatuses },
        },
      }),

      // Total commandes
      db.order.count(),

      // Messages non lus
      db.contactMessage.count({ where: { status: "new" } }),

      // Top 5 produits par quantité totale commandée
      db.orderItem.groupBy({
        by: ["productName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // 8 dernières commandes
      db.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          fullName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Transformer topProducts en format { name, count }
    const topProducts = topProductsRaw.map((p) => ({
      name: p.productName,
      count: p._sum.quantity ?? 0,
    }));

    // Sérialiser les dates ISO
    const recentOrdersDTO = recentOrders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));

    const stats: AdminStatsDTO = {
      newOrders,
      pendingOrders,
      monthRevenue: monthRevenue._sum.total ?? 0,
      totalOrders,
      unreadMessages,
      topProducts,
      recentOrders: recentOrdersDTO,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    console.error("[GET /api/admin/stats] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

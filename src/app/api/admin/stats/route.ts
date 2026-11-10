import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/stats - Dashboard statistics
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Orders stats
    const totalOrders = await prisma.order.count();
    const ordersThisMonth = await prisma.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    // Revenue stats
    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['delivered', 'shipped'] } },
    });

    const revenueThisMonth = await prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['delivered', 'shipped'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Products stats
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: { visible: true },
    });

    // Quotes stats
    const totalQuotes = await prisma.quote.count();
    const pendingQuotes = await prisma.quote.count({
      where: { status: 'pending' },
    });

    // Recent activity
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        fullName: true,
        createdAt: true,
      },
    });

    const recentQuotes = await prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        number: true,
        status: true,
        customerName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        byStatus: ordersByStatus,
        recent: recentOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        thisMonth: revenueThisMonth._sum.total || 0,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      quotes: {
        total: totalQuotes,
        pending: pendingQuotes,
        recent: recentQuotes,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/stats] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/quotes - List all quotes
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const quotes = await prisma.quote.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotes);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/quotes] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    );
  }
}

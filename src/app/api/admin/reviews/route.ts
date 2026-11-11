import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/reviews - Get all reviews
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/reviews/:id - Publish/unpublish review
export async function PATCH(req: NextRequest) {
  try {
    await verifySession(req);
    const body = await req.json();
    const { id, published } = body;

    const review = await db.review.update({
      where: { id },
      data: {
        published,
        ...(published && { publishedAt: new Date() }),
      },
    });

    return NextResponse.json(review);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

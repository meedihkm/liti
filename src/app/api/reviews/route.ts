import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/reviews - Get published reviews
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('[GET /api/reviews] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/reviews - Submit a review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const review = await prisma.review.create({
      data: {
        orderId: body.orderId || '',
        customerName: body.customerName,
        rating: body.rating,
        comment: body.comment || '',
        photos: body.photos || '[]',
        published: false, // Admin must approve
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('[POST /api/reviews] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/promo-codes
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const promoCodes = await db.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(promoCodes);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/promo-codes
export async function POST(req: NextRequest) {
  try {
    await verifySession(req);
    const body = await req.json();

    const promoCode = await db.promoCode.create({
      data: {
        code: body.code.toUpperCase(),
        type: body.type,
        value: body.value,
        minAmount: body.minAmount || 0,
        maxUses: body.maxUses || 0,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        active: body.active ?? true,
      },
    });

    return NextResponse.json(promoCode, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

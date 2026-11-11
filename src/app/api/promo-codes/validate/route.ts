import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/promo-codes/validate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderAmount } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const promoCode = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
    }

    // Check active
    if (!promoCode.active) {
      return NextResponse.json({ error: 'Code inactif' }, { status: 400 });
    }

    // Check dates
    const now = new Date();
    if (now < new Date(promoCode.validFrom) || now > new Date(promoCode.validUntil)) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 });
    }

    // Check usage limit
    if (promoCode.maxUses > 0 && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json(
        { error: 'Limite d\'utilisation atteinte' },
        { status: 400 }
      );
    }

    // Check minimum amount
    if (orderAmount && orderAmount < promoCode.minAmount) {
      return NextResponse.json(
        {
          error: `Montant minimum : ${promoCode.minAmount} DA`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.type === 'percentage') {
      discount = Math.round((orderAmount * promoCode.value) / 100);
    } else {
      discount = promoCode.value;
    }

    return NextResponse.json({
      valid: true,
      discount,
      type: promoCode.type,
      value: promoCode.value,
    });
  } catch (error) {
    console.error('[POST /api/promo-codes/validate] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

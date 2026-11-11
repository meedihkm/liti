import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTrackingToken, getTrackingUrl } from '@/lib/order-utils';

// POST /api/tracking - Get tracking link by order number and phone
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Numéro de commande et téléphone requis' },
        { status: 400 }
      );
    }

    // Find order
    const order = await db.order.findFirst({
      where: {
        number: orderNumber,
        phone,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable. Vérifiez le numéro et le téléphone.' },
        { status: 404 }
      );
    }

    // Ensure tracking token exists
    const token = await ensureTrackingToken(order.id);
    const trackingUrl = getTrackingUrl(token);

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.number,
      trackingUrl,
      token,
    });
  } catch (error) {
    console.error('[POST /api/tracking] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du lien de suivi' },
      { status: 500 }
    );
  }
}

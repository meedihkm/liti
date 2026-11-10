import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/orders/:id/advancements - Add advancement with photos
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id: orderId } = await params;
    const body = await req.json();

    const { stage, title, titleAr, description, photos, progress } = body;

    if (!stage || !title || !titleAr) {
      return NextResponse.json(
        { error: 'Les champs stage, title et titleAr sont requis' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    const advancement = await prisma.orderAdvancement.create({
      data: {
        orderId,
        stage,
        title,
        titleAr,
        description: description || '',
        photos: photos || '[]',
        progress: progress || 0,
      },
    });

    // Update order status to crafting if not already
    if (order.status === 'validated') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'crafting' },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: 'crafting',
          note: 'Début de la confection',
          actor: 'system',
        },
      });
    }

    return NextResponse.json(advancement, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[POST /api/admin/orders/:id/advancements] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de l\'avancement' },
      { status: 500 }
    );
  }
}

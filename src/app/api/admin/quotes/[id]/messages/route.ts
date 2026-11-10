import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/quotes/:id/messages - Add admin message
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await verifySession(req);
    const { id } = await params;
    const body = await req.json();
    const { message, attachments } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const quoteMessage = await prisma.quoteMessage.create({
      data: {
        quoteId: id,
        sender: 'admin',
        senderName: user.name,
        message,
        attachments: attachments || '[]',
      },
    });

    // Update quote status to in_discussion if it was pending
    if (quote.status === 'pending') {
      await prisma.quote.update({
        where: { id },
        data: { status: 'in_discussion' },
      });

      await prisma.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: 'in_discussion',
          note: 'Admin a répondu',
          actor: user.name,
        },
      });
    }

    return NextResponse.json(quoteMessage, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[POST /api/admin/quotes/:id/messages] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}

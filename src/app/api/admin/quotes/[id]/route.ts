import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/quotes/:id - Get single quote
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/quotes/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du devis' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/quotes/:id - Update quote (send response, change status)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await verifySession(req);
    const { id } = await params;
    const body = await req.json();

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.estimatedPrice !== undefined && {
          estimatedPrice: body.estimatedPrice,
        }),
        ...(body.estimatedDays !== undefined && {
          estimatedDays: body.estimatedDays,
        }),
        ...(body.adminNotes !== undefined && {
          adminNotes: body.adminNotes,
        }),
      },
    });

    // Add history entry if status changed
    if (body.status && body.status !== quote.status) {
      await prisma.quoteStatusHistory.create({
        data: {
          quoteId: id,
          status: body.status,
          note: body.statusNote || '',
          actor: user.name,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[PATCH /api/admin/quotes/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du devis' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/quotes/:id - Delete quote
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    await prisma.quote.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[DELETE /api/admin/quotes/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du devis' },
      { status: 500 }
    );
  }
}

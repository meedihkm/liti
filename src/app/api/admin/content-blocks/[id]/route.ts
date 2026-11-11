import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// PATCH /api/admin/content-blocks/:id - Update content block
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;
    const body = await req.json();

    const block = await db.contentBlock.findUnique({ where: { id } });
    if (!block) {
      return NextResponse.json(
        { error: 'Bloc introuvable' },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== block.slug) {
      const existing = await db.contentBlock.findUnique({
        where: { slug: body.slug },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ce slug existe déjà' },
          { status: 400 }
        );
      }
    }

    const updated = await db.contentBlock.update({
      where: { id },
      data: {
        ...(body.slug && { slug: body.slug }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.contentAr !== undefined && { contentAr: body.contentAr }),
        ...(body.type && { type: body.type }),
        ...(body.visible !== undefined && { visible: body.visible }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[PATCH /api/admin/content-blocks/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bloc' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content-blocks/:id - Delete content block
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const block = await db.contentBlock.findUnique({ where: { id } });
    if (!block) {
      return NextResponse.json(
        { error: 'Bloc introuvable' },
        { status: 404 }
      );
    }

    await db.contentBlock.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[DELETE /api/admin/content-blocks/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du bloc' },
      { status: 500 }
    );
  }
}

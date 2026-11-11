import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// PATCH /api/admin/gallery-images/:id - Update image
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;
    const body = await req.json();

    const image = await db.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json(
        { error: 'Image introuvable' },
        { status: 404 }
      );
    }

    const updated = await db.galleryImage.update({
      where: { id },
      data: {
        ...(body.url && { url: body.url }),
        ...(body.alt !== undefined && { alt: body.alt }),
        ...(body.caption !== undefined && { caption: body.caption }),
        ...(body.captionAr !== undefined && { captionAr: body.captionAr }),
        ...(body.productId !== undefined && { productId: body.productId }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[PATCH /api/admin/gallery-images/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'image' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gallery-images/:id - Delete image
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const image = await db.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json(
        { error: 'Image introuvable' },
        { status: 404 }
      );
    }

    await db.galleryImage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[DELETE /api/admin/gallery-images/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'image' },
      { status: 500 }
    );
  }
}

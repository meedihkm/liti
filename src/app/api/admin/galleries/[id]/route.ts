import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

// GET /api/admin/galleries/:id - Get single gallery
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const gallery = await db.gallery.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galerie introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(gallery);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/galleries/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la galerie' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/galleries/:id - Update gallery
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;
    const body = await req.json();

    const gallery = await db.gallery.findUnique({ where: { id } });
    if (!gallery) {
      return NextResponse.json(
        { error: 'Galerie introuvable' },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== gallery.slug) {
      const existing = await db.gallery.findUnique({
        where: { slug: body.slug },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Ce slug existe déjà' },
          { status: 400 }
        );
      }
    }

    const updated = await db.gallery.update({
      where: { id },
      data: {
        ...(body.slug && { slug: body.slug }),
        ...(body.title && { title: body.title }),
        ...(body.titleAr && { titleAr: body.titleAr }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.descriptionAr !== undefined && {
          descriptionAr: body.descriptionAr,
        }),
        ...(body.coverImage !== undefined && {
          coverImage: body.coverImage,
        }),
        ...(body.type && { type: body.type }),
        ...(body.visible !== undefined && { visible: body.visible }),
        ...(body.order !== undefined && { order: body.order }),
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[PATCH /api/admin/galleries/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la galerie' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/galleries/:id - Delete gallery
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await verifySession(req);
    const { id } = await params;

    const gallery = await db.gallery.findUnique({ where: { id } });
    if (!gallery) {
      return NextResponse.json(
        { error: 'Galerie introuvable' },
        { status: 404 }
      );
    }

    await db.gallery.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[DELETE /api/admin/galleries/:id] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la galerie' },
      { status: 500 }
    );
  }
}

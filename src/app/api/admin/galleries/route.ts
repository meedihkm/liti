import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/galleries - List all galleries
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const galleries = await prisma.gallery.findMany({
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(galleries);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/galleries] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des galeries' },
      { status: 500 }
    );
  }
}

// POST /api/admin/galleries - Create new gallery
export async function POST(req: NextRequest) {
  try {
    await verifySession(req);

    const body = await req.json();
    const {
      slug,
      title,
      titleAr,
      description,
      descriptionAr,
      coverImage,
      type,
      visible,
      order,
    } = body;

    if (!slug || !title || !titleAr) {
      return NextResponse.json(
        { error: 'Les champs slug, title et titleAr sont requis' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.gallery.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà' },
        { status: 400 }
      );
    }

    const gallery = await prisma.gallery.create({
      data: {
        slug,
        title,
        titleAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        coverImage: coverImage || '',
        type: type || 'lookbook',
        visible: visible ?? true,
        order: order ?? 0,
      },
    });

    return NextResponse.json(gallery, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[POST /api/admin/galleries] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la galerie' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// POST /api/admin/gallery-images - Add image to gallery
export async function POST(req: NextRequest) {
  try {
    await verifySession(req);

    const body = await req.json();
    const {
      galleryId,
      url,
      alt,
      caption,
      captionAr,
      productId,
      order,
    } = body;

    if (!galleryId || !url) {
      return NextResponse.json(
        { error: 'Les champs galleryId et url sont requis' },
        { status: 400 }
      );
    }

    // Verify gallery exists
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galerie introuvable' },
        { status: 404 }
      );
    }

    const image = await prisma.galleryImage.create({
      data: {
        galleryId,
        url,
        alt: alt || '',
        caption: caption || '',
        captionAr: captionAr || '',
        productId: productId || '',
        order: order ?? 0,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[POST /api/admin/gallery-images] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de l\'image' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/auth';

// GET /api/admin/content-blocks - List all content blocks
export async function GET(req: NextRequest) {
  try {
    await verifySession(req);

    const blocks = await prisma.contentBlock.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(blocks);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[GET /api/admin/content-blocks] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des blocs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content-blocks - Create new content block
export async function POST(req: NextRequest) {
  try {
    await verifySession(req);

    const body = await req.json();
    const {
      slug,
      title,
      titleAr,
      content,
      contentAr,
      type,
      visible,
      order,
    } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Le champ slug est requis' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.contentBlock.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Ce slug existe déjà' },
        { status: 400 }
      );
    }

    const block = await prisma.contentBlock.create({
      data: {
        slug,
        title: title || '',
        titleAr: titleAr || '',
        content: content || '',
        contentAr: contentAr || '',
        type: type || 'hero',
        visible: visible ?? true,
        order: order ?? 0,
      },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.error('[POST /api/admin/content-blocks] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du bloc' },
      { status: 500 }
    );
  }
}

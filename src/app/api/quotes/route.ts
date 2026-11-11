import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/quotes - Create new quote request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      wilayaCode,
      commune,
      productType,
      description,
      referenceImages,
      fabricPreference,
      colorPreference,
      budget,
      deadline,
    } = body;

    if (!customerName || !customerPhone || !wilayaCode || !description) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Get wilaya name
    const wilaya = (await import('@/lib/constants')).wilayaByCode(wilayaCode);
    if (!wilaya) {
      return NextResponse.json({ error: 'Wilaya invalide' }, { status: 400 });
    }

    // Generate quote number
    const year = new Date().getFullYear();
    const count = await db.quote.count();
    const number = `DEV-${year}-${String(count + 1).padStart(4, '0')}`;

    const quote = await db.quote.create({
      data: {
        number,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        wilayaCode,
        wilayaName: wilaya.name,
        commune: commune || '',
        productType: productType || '',
        description,
        referenceImages: referenceImages || '[]',
        fabricPreference: fabricPreference || '',
        colorPreference: colorPreference || '',
        budget: budget || 0,
        deadline: deadline || '',
      },
    });

    // Create initial status history
    await db.quoteStatusHistory.create({
      data: {
        quoteId: quote.id,
        status: 'pending',
        note: 'Demande de devis créée',
        actor: 'customer',
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('[POST /api/quotes] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du devis' },
      { status: 500 }
    );
  }
}

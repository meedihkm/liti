import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { QuoteDetail } from '@/components/quote/quote-detail';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quote = await db.quote.findUnique({ where: { id } });

  if (!quote) {
    return { title: 'Devis introuvable | Taqendurt' };
  }

  return {
    title: `Devis ${quote.number} | Taqendurt`,
    description: 'Suivez votre demande de devis',
  };
}

export const revalidate = 0; // Always fresh data for quotes

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;

  const quote = await db.quote.findUnique({
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
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <QuoteDetail quote={quote} />
      </div>
    </div>
  );
}

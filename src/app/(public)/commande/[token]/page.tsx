import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { OrderTracking } from '@/components/order/order-tracking';

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Suivi de commande | Taqendurt',
    description: 'Suivez l\'avancement de votre commande en temps réel',
  };
}

export const revalidate = 0; // Always fresh for order tracking

export default async function SuiviCommandePage({ params }: Props) {
  const { token } = await params;

  const trackingToken = await prisma.trackingToken.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          items: true,
          history: {
            orderBy: { createdAt: 'desc' },
          },
          advancements: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!trackingToken) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <OrderTracking order={trackingToken.order} />
      </div>
    </div>
  );
}

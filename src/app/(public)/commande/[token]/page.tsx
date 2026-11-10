import { Metadata } from 'next';

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Suivi de commande | Taqendurt',
    description: 'Suivez l\'avancement de votre commande en temps réel',
  };
}

export default async function SuiviCommandePage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Suivi de commande</h1>
      <p className="text-muted-foreground">Token: {token}</p>
      <p className="text-sm text-muted-foreground mt-2">Phase 3 à implémenter</p>
    </div>
  );
}

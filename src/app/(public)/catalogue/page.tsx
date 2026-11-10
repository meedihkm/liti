import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue | Taqendurt',
  description: 'Notre catalogue de robes kabyles',
};

export default function CataloguePage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Catalogue</h1>
      <p className="text-muted-foreground">Migration depuis hash router en cours</p>
    </div>
  );
}

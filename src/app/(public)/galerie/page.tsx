import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galerie | Taqendurt',
  description: 'Découvrez notre collection de robes kabyles traditionnelles',
};

export default function GaleriePage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Galerie</h1>
      <p className="text-muted-foreground">Page galerie - Phase 1 à implémenter</p>
    </div>
  );
}

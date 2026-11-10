import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configurateur | Taqendurt',
  description: 'Créez votre robe sur-mesure',
};

export default function ConfigurateurPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Configurateur</h1>
      <p className="text-muted-foreground">Wizard configurateur à migrer</p>
    </div>
  );
}

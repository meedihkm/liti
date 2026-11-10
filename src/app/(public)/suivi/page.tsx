'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SuiviPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const data = await res.json();
      router.push(`/commande/${data.token}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la recherche'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Suivre ma commande</h1>
          <p className="text-muted-foreground">
            Entrez votre numéro de commande et téléphone pour accéder au suivi
            en temps réel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orderNumber">
              Numéro de commande <span className="text-destructive">*</span>
            </Label>
            <Input
              id="orderNumber"
              placeholder="RK-2026-0001"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="text-center text-lg tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="05XX XX XX XX"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Recherche...' : 'Accéder au suivi'}
          </Button>
        </form>

        <div className="mt-8 p-6 bg-primary/5 rounded-xl">
          <h3 className="font-semibold mb-2">💡 Astuce</h3>
          <p className="text-sm text-muted-foreground">
            Vous pouvez également accéder directement à votre commande via le
            lien de suivi envoyé par SMS ou email.
          </p>
        </div>
      </div>
    </div>
  );
}

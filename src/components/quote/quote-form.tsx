'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { WILAYAS } from '@/lib/wilayas';

export function QuoteForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    wilayaCode: '',
    commune: '',
    productType: '',
    description: '',
    fabricPreference: '',
    colorPreference: '',
    budget: '',
    deadline: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur upload');

      const data = await res.json();
      setImages((prev) => [...prev, ...data.urls]);
      toast.success(`${files.length} image(s) ajoutée(s)`);
    } catch (error) {
      toast.error('Erreur lors du téléchargement des images');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wilayaCode: parseInt(formData.wilayaCode),
          budget: formData.budget ? parseInt(formData.budget) : 0,
          referenceImages: JSON.stringify(images),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }

      const quote = await res.json();
      toast.success('Demande de devis envoyée !');
      router.push(`/devis/${quote.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l\'envoi'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-card border rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold">Vos coordonnées</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="customerName">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              required
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              required
              placeholder="05XX XX XX XX"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email (optionnel)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wilayaCode">
              Wilaya <span className="text-destructive">*</span>
            </Label>
            <select
              id="wilayaCode"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.wilayaCode}
              onChange={(e) =>
                setFormData({ ...formData, wilayaCode: e.target.value })
              }
            >
              <option value="">Sélectionner</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="commune">Commune</Label>
            <Input
              id="commune"
              value={formData.commune}
              onChange={(e) =>
                setFormData({ ...formData, commune: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold">Votre projet</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productType">Type de robe souhaité</Label>
            <Input
              id="productType"
              placeholder="Ex: Karakou, Robe kabyle, Gandoura..."
              value={formData.productType}
              onChange={(e) =>
                setFormData({ ...formData, productType: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description détaillée <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              required
              rows={6}
              placeholder="Décrivez votre robe idéale : style, occasion, détails souhaités..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fabricPreference">Tissu préféré</Label>
              <Input
                id="fabricPreference"
                placeholder="Ex: Soie, Satin, Velours..."
                value={formData.fabricPreference}
                onChange={(e) =>
                  setFormData({ ...formData, fabricPreference: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorPreference">Couleur souhaitée</Label>
              <Input
                id="colorPreference"
                placeholder="Ex: Bleu royal, Rouge bordeaux..."
                value={formData.colorPreference}
                onChange={(e) =>
                  setFormData({ ...formData, colorPreference: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget indicatif (DA)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Ex: 25000"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Date souhaitée</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Photos de référence (optionnel)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Ajoutez des photos pour nous aider à mieux comprendre votre projet
            </p>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt={`Référence ${i + 1}`} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
      </Button>
    </form>
  );
}

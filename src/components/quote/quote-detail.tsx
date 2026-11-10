'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Quote = {
  id: string;
  number: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  wilayaName: string;
  commune: string;
  productType: string;
  description: string;
  referenceImages: string;
  fabricPreference: string;
  colorPreference: string;
  budget: number;
  deadline: string;
  estimatedPrice: number;
  estimatedDays: number;
  adminNotes: string;
  createdAt: Date;
  messages: Array<{
    id: string;
    sender: string;
    senderName: string;
    message: string;
    attachments: string;
    createdAt: Date;
  }>;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500' },
  in_discussion: { label: 'En discussion', color: 'bg-blue-500' },
  quoted: { label: 'Devis envoyé', color: 'bg-purple-500' },
  accepted: { label: 'Accepté', color: 'bg-green-500' },
  rejected: { label: 'Refusé', color: 'bg-red-500' },
  converted_to_order: { label: 'Converti en commande', color: 'bg-emerald-500' },
};

export function QuoteDetail({ quote }: { quote: Quote }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const status = STATUS_LABELS[quote.status] || STATUS_LABELS.pending;
  const referenceImages = JSON.parse(quote.referenceImages || '[]');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          attachments: JSON.stringify(images),
        }),
      });

      if (!res.ok) throw new Error('Erreur envoi');

      setMessage('');
      setImages([]);
      toast.success('Message envoyé');
      window.location.reload(); // Refresh messages
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

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
      toast.success('Image(s) ajoutée(s)');
    } catch (error) {
      toast.error('Erreur upload');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Devis {quote.number}</h1>
            <p className="text-muted-foreground">
              Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <span className="font-medium">{status.label}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Informations client</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{quote.customerName}</p>
              <p>{quote.customerPhone}</p>
              {quote.customerEmail && <p>{quote.customerEmail}</p>}
              <p>{quote.wilayaName} {quote.commune && `- ${quote.commune}`}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Détails du projet</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {quote.productType && <p><strong>Type :</strong> {quote.productType}</p>}
              {quote.fabricPreference && <p><strong>Tissu :</strong> {quote.fabricPreference}</p>}
              {quote.colorPreference && <p><strong>Couleur :</strong> {quote.colorPreference}</p>}
              {quote.budget > 0 && <p><strong>Budget :</strong> {quote.budget} DA</p>}
              {quote.deadline && <p><strong>Date souhaitée :</strong> {quote.deadline}</p>}
            </div>
          </div>
        </div>

        {quote.description && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quote.description}
            </p>
          </div>
        )}

        {referenceImages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Photos de référence</h3>
            <div className="flex flex-wrap gap-2">
              {referenceImages.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-24 h-24 rounded-lg overflow-hidden border hover:opacity-80 transition"
                >
                  <img src={url} alt={`Référence ${i + 1}`} className="object-cover w-full h-full" />
                </a>
              ))}
            </div>
          </div>
        )}

        {(quote.estimatedPrice > 0 || quote.adminNotes) && (
          <div className="mt-8 p-6 bg-primary/5 rounded-xl">
            <h3 className="font-semibold mb-4 text-lg">Notre réponse</h3>
            <div className="space-y-2">
              {quote.estimatedPrice > 0 && (
                <p><strong>Prix estimé :</strong> {quote.estimatedPrice.toLocaleString()} DA</p>
              )}
              {quote.estimatedDays > 0 && (
                <p><strong>Délai estimé :</strong> {quote.estimatedDays} jours</p>
              )}
              {quote.adminNotes && (
                <p className="text-sm text-muted-foreground mt-4">{quote.adminNotes}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-card border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Discussion</h2>

        {quote.messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun message pour le moment
          </p>
        ) : (
          <div className="space-y-4 mb-8">
            {quote.messages.map((msg) => {
              const isCustomer = msg.sender === 'customer';
              const attachments = JSON.parse(msg.attachments || '[]');

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      isCustomer
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {msg.senderName || (isCustomer ? 'Vous' : 'Taqendurt')}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {attachments.map((url: string, i: number) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-16 h-16 rounded overflow-hidden border"
                          >
                            <img src={url} alt={`Pièce jointe ${i + 1}`} className="object-cover w-full h-full" />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message form */}
        <form onSubmit={handleSendMessage} className="space-y-4">
          <Textarea
            placeholder="Écrivez votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
          />

          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !message.trim()}>
              {sending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded border">
                  <img src={url} alt={`Upload ${i + 1}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

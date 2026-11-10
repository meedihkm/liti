'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type Order = {
  id: string;
  number: string;
  status: string;
  fullName: string;
  phone: string;
  wilayaName: string;
  commune: string;
  total: number;
  createdAt: Date;
  items: Array<{
    productName: string;
    productImage: string;
    fabricName: string;
    colorName: string;
    quantity: number;
    lineTotal: number;
  }>;
  advancements: Array<{
    id: string;
    stage: string;
    title: string;
    titleAr: string;
    description: string;
    photos: string;
    progress: number;
    createdAt: Date;
  }>;
  history: Array<{
    id: string;
    status: string;
    note: string;
    createdAt: Date;
  }>;
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: '⏳' },
  validated: { label: 'Validée', color: 'bg-blue-500', icon: '✓' },
  crafting: { label: 'En confection', color: 'bg-purple-500', icon: '✂️' },
  ready: { label: 'Prête', color: 'bg-green-500', icon: '✨' },
  shipped: { label: 'Expédiée', color: 'bg-indigo-500', icon: '📦' },
  delivered: { label: 'Livrée', color: 'bg-emerald-500', icon: '🎉' },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: '✕' },
};

const STAGE_INFO: Record<string, { label: string; icon: string }> = {
  fabric_cutting: { label: 'Découpe du tissu', icon: '✂️' },
  embroidery: { label: 'Broderie', icon: '🧵' },
  assembly: { label: 'Assemblage', icon: '👗' },
  finishing: { label: 'Finitions', icon: '✨' },
  quality_check: { label: 'Contrôle qualité', icon: '✓' },
};

export function OrderTracking({ order }: { order: Order }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.pending;

  // Calculate overall progress
  const overallProgress = order.advancements.length > 0
    ? Math.round(
        order.advancements.reduce((sum, adv) => sum + adv.progress, 0) /
          order.advancements.length
      )
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card border rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Commande {order.number}</h1>
            <p className="text-muted-foreground">
              Créée {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <span className="text-2xl">{statusInfo.icon}</span>
              <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
              <span className="font-semibold text-lg">{statusInfo.label}</span>
            </div>
            {order.status === 'crafting' && (
              <div className="text-sm text-muted-foreground">
                Progression : {overallProgress}%
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for crafting status */}
        {order.status === 'crafting' && (
          <div className="mb-6">
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Client</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{order.fullName}</p>
              <p>{order.phone}</p>
              <p>{order.wilayaName} {order.commune && `- ${order.commune}`}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-semibold mb-2">Total</h3>
            <p className="text-3xl font-bold">{order.total.toLocaleString()} DA</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-card border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Articles</h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-xl">
              {item.productImage && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{item.productName}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {item.fabricName && <p>Tissu : {item.fabricName}</p>}
                  {item.colorName && <p>Couleur : {item.colorName}</p>}
                  <p>Quantité : {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.lineTotal.toLocaleString()} DA</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advancements with photos */}
      {order.advancements.length > 0 && (
        <div className="bg-card border rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">🎨 Suivi de la confection</h2>
          <div className="space-y-6">
            {order.advancements.map((advancement) => {
              const photos = JSON.parse(advancement.photos || '[]');
              const stageInfo = STAGE_INFO[advancement.stage] || { label: advancement.stage, icon: '📌' };

              return (
                <div key={advancement.id} className="border-l-4 border-primary pl-6 pb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{stageInfo.icon}</span>
                        <h3 className="text-xl font-semibold">{advancement.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(advancement.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">{advancement.progress}%</span>
                    </div>
                  </div>

                  {advancement.description && (
                    <p className="text-muted-foreground mb-4">{advancement.description}</p>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {photos.map((url: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(url)}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition group"
                        >
                          <Image
                            src={url}
                            alt={`${advancement.title} ${i + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-card border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Historique</h2>
        <div className="space-y-3">
          {order.history.map((entry) => {
            const statusInfo = STATUS_INFO[entry.status] || { label: entry.status, icon: '•' };
            return (
              <div key={entry.id} className="flex gap-4 items-start">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span>{statusInfo.icon}</span>
                  <span className="font-medium text-sm">{statusInfo.label}</span>
                </div>
                <div className="flex-1">
                  {entry.note && (
                    <p className="text-sm text-muted-foreground">{entry.note}</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox for images */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Photo d'avancement"
              fill
              className="object-contain"
            />
          </div>
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

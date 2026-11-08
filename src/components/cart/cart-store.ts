"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Panier (Zustand + persistance localStorage).
// Le prix stocké est une ESTIMATION client : le serveur
// recalcule toujours le prix autoritaire à la commande.
// ─────────────────────────────────────────────────────────────

export interface CartItem extends CartLine {
  id: string
}

interface CartState {
  items: CartItem[]
  add: (line: CartLine) => string
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

function lineId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (line) => {
        const id = lineId()
        set((state) => ({ items: [...state.items, { ...line, id }] }))
        return id
      },
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(10, qty)) } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "rk-cart" }
  )
)

/** Nombre total d'articles (somme des quantités) */
export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0)
}

/** Sous-total estimé côté client */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
}

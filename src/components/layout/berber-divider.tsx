"use client";

import { cn } from "@/lib/utils";

// Séparateur berbère géométrique — ligne fine dorée, deux variantes
export function BerberDivider({ variant = "zigzag", className }: { variant?: "zigzag" | "line"; className?: string }) {
  if (variant === "line") {
    return (
      <svg
        className={cn("h-px w-full text-gold/40", className)}
        viewBox="0 0 400 2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="berber-line" x1="0" x2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="1" fill="url(#berber-line)" />
        <circle cx="200" cy="1" r="1.5" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg
      className={cn("h-3 w-full text-gold/45", className)}
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 6 L10 1 L20 6 L30 1 L40 6 L50 1 L60 6 L70 1 L80 6 L90 1 L100 6 L110 1 L120 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}

// Motif « tifinagh » ⵣ utilisé comme sigle de marque
export function YazMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M16 3 L29 16 L16 29 L3 16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path
        d="M16 8.5 L23.5 16 L16 23.5 L8.5 16 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M16 12 L20 16 L16 20 L12 16 Z" fill="currentColor" />
    </svg>
  )
}

"use client";

// ─────────────────────────────────────────────────────────────
// ThemeBackground — Applique le thème de fond choisi par l'admin
// Lit le setting theme_background depuis publicData et applique
// les classes Tailwind correspondantes au body ou conteneur
// ─────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { usePublicData } from "@/components/providers/public-data-provider";

const THEME_GRADIENTS: Record<string, string> = {
  default: "bg-gradient-to-br from-background to-accent/20",
  warm: "bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20",
  cool: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
  elegant: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
  nature: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
  sunset: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/20 dark:to-orange-950/20",
  ocean: "bg-gradient-to-br from-teal-50 to-blue-100 dark:from-teal-950/20 dark:to-blue-950/20",
  minimal: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20",
};

export function ThemeBackground() {
  const { settings } = usePublicData();

  useEffect(() => {
    const theme = settings.theme_background || "default";
    const classes = THEME_GRADIENTS[theme] || THEME_GRADIENTS.default;
    
    // Applique les classes au body
    const body = document.body;
    
    // Retire toutes les anciennes classes de thème
    Object.values(THEME_GRADIENTS).forEach((gradient) => {
      gradient.split(" ").forEach((cls) => body.classList.remove(cls));
    });
    
    // Ajoute les nouvelles classes
    classes.split(" ").forEach((cls) => body.classList.add(cls));
    
    return () => {
      // Nettoie au démontage
      classes.split(" ").forEach((cls) => body.classList.remove(cls));
    };
  }, [settings.theme_background]);

  return null; // Composant sans rendu visuel
}

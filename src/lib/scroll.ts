"use client";

// Défilement fluide Lenis — chargé en différé, désactivé pour
// prefers-reduced-motion. L'instance est exposée via un module
// pour permettre le reset de scroll au changement de vue.

type LenisLike = { scrollTo: (target: number | string, opts?: Record<string, unknown>) => void };

let lenisInstance: LenisLike | null = null;

export function setLenis(instance: LenisLike | null) {
  lenisInstance = instance;
}

export function scrollTop(immediate = true) {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate });
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
  }
}

// ─────────────────────────────────────────────────────────────
// Interpolation de la silhouette selon les mesures
// ─────────────────────────────────────────────────────────────

import type { MeasurementValues, SilhouetteFactors } from "./types";

// Valeurs médianes de référence (taille M)
const REFERENCE = {
  chest: 92,
  waist: 74,
  hips: 98,
  shoulders: 40,
  length: 145,
  sleeve: 58,
};

/**
 * Calcule les facteurs de déformation de la silhouette
 */
export function interpolateSilhouette(measurements: MeasurementValues): SilhouetteFactors {
  return {
    torsoWidth: measurements.chest / REFERENCE.chest,
    waistWidth: measurements.waist / REFERENCE.waist,
    hipsWidth: measurements.hips / REFERENCE.hips,
    shouldersWidth: measurements.shoulders / REFERENCE.shoulders,
    totalHeight: measurements.length / REFERENCE.length,
  };
}

/**
 * Applique les facteurs aux coordonnées SVG
 */
export function applyFactorsToPath(
  originalPath: string,
  factors: SilhouetteFactors
): string {
  // Simplification : on retourne le path original
  // Dans une implémentation complète, on parserait et modifierait les coordonnées
  return originalPath;
}

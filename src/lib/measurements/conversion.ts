// ─────────────────────────────────────────────────────────────
// Conversions et estimations de mesures
// ─────────────────────────────────────────────────────────────

import type { MeasurementValues, DressReferenceInput, EstimationInput } from "./types";

/**
 * Convertit cm → pouces
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Convertit pouces → cm
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Convertit mesures d'une robe à plat en tours de corps
 */
export function convertFromDress(flat: DressReferenceInput): MeasurementValues {
  return {
    chest: flat.chestWidth * 2,
    waist: flat.waistWidth * 2,
    hips: flat.hipWidth * 2,
    shoulders: flat.shoulderWidth * 2,
    sleeve: 58, // Valeur médiane par défaut
    length: flat.totalLength,
  };
}

/**
 * Estime les mesures à partir de la taille et du poids
 * Algorithme simplifié, NON médical, uniquement pour démarrage
 */
export function estimateMeasurements(input: EstimationInput): MeasurementValues {
  const { height, weight } = input;

  // BMI = poids / (taille_m)²
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  // Estimations très approximatives basées sur des moyennes larges
  // Ces valeurs seront ajustées par la cliente
  const baseChest = 88 + (bmi - 22) * 2;
  const baseWaist = 70 + (bmi - 22) * 2.5;
  const baseHips = 94 + (bmi - 22) * 2;

  return {
    chest: Math.round(Math.max(60, Math.min(160, baseChest))),
    waist: Math.round(Math.max(50, Math.min(150, baseWaist))),
    hips: Math.round(Math.max(60, Math.min(170, baseHips))),
    shoulders: Math.round(height * 0.24), // ~40 cm pour 165 cm
    sleeve: Math.round(height * 0.35), // ~58 cm pour 165 cm
    length: Math.round(height * 0.88), // ~145 cm pour 165 cm
  };
}

// ─────────────────────────────────────────────────────────────
// Règles de cohérence des mesures (configurables)
// ─────────────────────────────────────────────────────────────

import type { MeasurementValues, CoherenceAlert, MeasurementFit } from "./types";
import type { MeasurementKey } from "../constants";

// Configuration des règles
export const MEASUREMENT_CONFIG = {
  // Plages par mesure (min/max en cm)
  ranges: {
    chest: { min: 60, max: 160 },
    waist: { min: 50, max: 150 },
    hips: { min: 60, max: 170 },
    shoulders: { min: 30, max: 60 },
    sleeve: { min: 30, max: 75 },
    length: { min: 80, max: 170 },
  },

  // Aisance par ajustement (en cm)
  ease: {
    fitted: 0,
    comfortable: 2,
    loose: 4,
  },

  // Seuils d'alerte
  thresholds: {
    previousDelta: 5, // cm
    estimationDelta: 8, // cm
    ageWarning: 6, // mois
  },

  // Vibration
  vibration: {
    enabled: true,
    duration: 10, // ms
    interval: 50, // ms min entre deux vibrations
  },
} as const;

interface CoherenceRule {
  name: string;
  check: (m: MeasurementValues) => boolean;
  message: { fr: string; ar: string };
}

// Règles de cohérence entre mesures
const COHERENCE_RULES: CoherenceRule[] = [
  {
    name: "waist_vs_chest",
    check: (m) => m.waist < m.chest * 1.3,
    message: {
      fr: "Le tour de taille est généralement inférieur au tour de poitrine",
      ar: "محيط الخصر عادة أقل من محيط الصدر",
    },
  },
  {
    name: "hips_vs_waist",
    check: (m) => m.hips > m.waist * 0.8,
    message: {
      fr: "Les hanches sont généralement plus larges que la taille",
      ar: "الوركان عادة أعرض من الخصر",
    },
  },
  {
    name: "sleeve_vs_length",
    check: (m) => m.sleeve < m.length * 0.6,
    message: {
      fr: "La longueur de manche semble disproportionnée",
      ar: "طول الكم يبدو غير متناسب",
    },
  },
  {
    name: "shoulders_vs_chest",
    check: (m) => m.shoulders < m.chest * 0.55,
    message: {
      fr: "La largeur d'épaules semble inhabituelle par rapport à la poitrine",
      ar: "عرض الكتفين يبدو غير عادي مقارنة بالصدر",
    },
  },
];

/**
 * Vérifie la cohérence des mesures
 */
export function checkCoherence(
  measurements: MeasurementValues,
  lang: "fr" | "ar" = "fr"
): CoherenceAlert[] {
  const alerts: CoherenceAlert[] = [];

  // Vérifier les plages
  for (const [key, value] of Object.entries(measurements) as [MeasurementKey, number][]) {
    const range = MEASUREMENT_CONFIG.ranges[key];
    if (!range) continue;

    if (value < range.min || value > range.max) {
      alerts.push({
        field: key,
        rule: "out_of_range",
        message:
          lang === "ar"
            ? `القيمة خارج المدى الموصى به (${range.min}–${range.max} سم)`
            : `Valeur hors de la plage conseillée (${range.min}–${range.max} cm)`,
      });
    }
  }

  // Vérifier les ratios
  for (const rule of COHERENCE_RULES) {
    if (!rule.check(measurements)) {
      alerts.push({
        field: "chest", // Champ générique, peut être affiné
        rule: rule.name,
        message: rule.message[lang],
      });
    }
  }

  return alerts;
}

/**
 * Compare avec le profil précédent
 */
export function checkPreviousDelta(
  current: MeasurementValues,
  previous: MeasurementValues,
  lang: "fr" | "ar" = "fr"
): CoherenceAlert[] {
  const alerts: CoherenceAlert[] = [];
  const threshold = MEASUREMENT_CONFIG.thresholds.previousDelta;

  for (const key of Object.keys(current) as MeasurementKey[]) {
    const delta = Math.abs(current[key] - previous[key]);
    if (delta > threshold) {
      alerts.push({
        field: key,
        rule: "previous_delta",
        delta,
        message:
          lang === "ar"
            ? `هذا القياس يختلف ${delta.toFixed(1)} سم عن ملفك الأخير`
            : `Cette mesure diffère de ${delta.toFixed(1)} cm par rapport à votre dernier profil`,
      });
    }
  }

  return alerts;
}

/**
 * Compare avec l'estimation taille/poids
 */
export function checkEstimationDelta(
  current: MeasurementValues,
  estimated: MeasurementValues,
  lang: "fr" | "ar" = "fr"
): CoherenceAlert[] {
  const alerts: CoherenceAlert[] = [];
  const threshold = MEASUREMENT_CONFIG.thresholds.estimationDelta;

  for (const key of Object.keys(current) as MeasurementKey[]) {
    const delta = Math.abs(current[key] - estimated[key]);
    if (delta > threshold) {
      alerts.push({
        field: key,
        rule: "estimation_delta",
        delta,
        message:
          lang === "ar"
            ? `هذا القياس يبتعد ${delta.toFixed(1)} سم عن التقدير`
            : `Cette mesure s'éloigne de ${delta.toFixed(1)} cm de l'estimation`,
      });
    }
  }

  return alerts;
}

/**
 * Applique l'aisance selon l'ajustement choisi
 */
export function applyEase(
  measurements: MeasurementValues,
  fit: MeasurementFit
): MeasurementValues {
  const ease = MEASUREMENT_CONFIG.ease[fit];

  return {
    chest: measurements.chest + ease,
    waist: measurements.waist + ease,
    hips: measurements.hips + ease,
    shoulders: measurements.shoulders,
    sleeve: measurements.sleeve,
    length: measurements.length,
  };
}

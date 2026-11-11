// ─────────────────────────────────────────────────────────────
// Hook pour vérifier la cohérence des mesures
// ─────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { checkCoherence } from "@/lib/measurements/rules";
import type { MeasurementValues, CoherenceAlert } from "@/lib/measurements/types";

export function useCoherenceCheck(
  measurements: Partial<MeasurementValues>,
  lang: "fr" | "ar" = "fr"
): CoherenceAlert[] {
  return useMemo(() => {
    const complete = measurements as MeasurementValues;
    const hasAll = Object.keys(complete).length === 6;

    if (!hasAll) return [];

    return checkCoherence(complete, lang);
  }, [measurements, lang]);
}

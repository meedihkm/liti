"use client";

// ─────────────────────────────────────────────────────────────
// Étape 3 : Silhouette vivante (preview temps réel)
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { BodySilhouette } from "../ui/body-silhouette";
import { interpolateSilhouette } from "@/lib/measurements/interpolation";
import type { MeasurementValues } from "@/lib/measurements/types";

interface Step3LivePreviewProps {
  measurements: Partial<MeasurementValues>;
  lang?: "fr" | "ar" | "kab";
}

export function Step3LivePreview({ measurements, lang = "fr" }: Step3LivePreviewProps) {
  const factors = measurements.chest
    ? interpolateSilhouette(measurements as MeasurementValues)
    : null;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold">
          {lang === "ar" ? "معاينة مباشرة" : "Aperçu en temps réel"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ar" ? "الصورة تتكيف مع قياساتك" : "La silhouette s'adapte à vos mesures"}
        </p>
      </div>

      <motion.div
        className="w-full max-w-sm"
        animate={
          factors
            ? {
                scaleX: factors.torsoWidth,
                scaleY: factors.totalHeight,
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        <BodySilhouette className="w-full" />
      </motion.div>

      {measurements.chest && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-sm">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="glass-strong rounded-lg p-3">
              <div className="font-medium capitalize">{key}</div>
              <div className="text-2xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

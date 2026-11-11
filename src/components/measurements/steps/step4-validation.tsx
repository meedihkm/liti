"use client";

// ─────────────────────────────────────────────────────────────
// Étape 4 : Contrôles de cohérence
// ─────────────────────────────────────────────────────────────

import { motion } from "motion/react";
import { useCoherenceCheck } from "../hooks/use-coherence-check";
import type { MeasurementValues, MeasurementKey } from "@/lib/measurements/types";

interface Step4ValidationProps {
  measurements: Partial<MeasurementValues>;
  confirmed: Partial<Record<MeasurementKey, boolean>>;
  onConfirm: (field: MeasurementKey) => void;
  onRecheck: (field: MeasurementKey) => void;
  onNext: () => void;
  lang?: "fr" | "ar";
}

export function Step4Validation({
  measurements,
  confirmed,
  onConfirm,
  onRecheck,
  onNext,
  lang = "fr",
}: Step4ValidationProps) {
  const alerts = useCoherenceCheck(measurements, lang);

  const unconfirmedAlerts = alerts.filter((a) => !confirmed[a.field]);

  if (unconfirmedAlerts.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center gap-6 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass-strong rounded-2xl p-8 text-center max-w-sm">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-display font-semibold mb-2">
            {lang === "ar" ? "جاهزة!" : "Prêt !"}
          </h2>
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "جميع القياسات تبدو جيدة"
              : "Toutes les mesures semblent cohérentes"}
          </p>
        </div>
        <button onClick={onNext} className="btn-primary w-full max-w-sm">
          {lang === "ar" ? "التالي" : "Continuer"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold">
          {lang === "ar" ? "التحقق" : "Vérification"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ar"
            ? "بعض القياسات تبدو غير عادية"
            : "Quelques mesures semblent inhabituelles"}
        </p>
      </div>

      <div className="space-y-4 w-full max-w-sm">
        {unconfirmedAlerts.map((alert, idx) => (
          <motion.div
            key={idx}
            className="glass-strong rounded-2xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold capitalize">{alert.field}</h3>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onRecheck(alert.field)}
                className="btn-outline flex-1"
              >
                {lang === "ar" ? "سأتحقق" : "Je vérifie"}
              </button>
              <button
                onClick={() => onConfirm(alert.field)}
                className="btn-primary flex-1"
              >
                {lang === "ar" ? "هذا صحيح" : "C'est correct"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

// ─────────────────────────────────────────────────────────────
// Étape 5 : Récapitulatif et sauvegarde
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { BodySilhouette } from "../ui/body-silhouette";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import type { MeasurementValues, MeasurementFit, MeasurementUnit } from "@/lib/measurements/types";

interface Step5SummaryProps {
  measurements: MeasurementValues;
  fit: MeasurementFit;
  unit: MeasurementUnit;
  note: string;
  onNoteChange: (note: string) => void;
  onEdit: (field: string) => void;
  onValidate: () => void;
  lang?: "fr" | "ar" | "kab";
}

export function Step5Summary({
  measurements,
  fit,
  unit,
  note,
  onNoteChange,
  onEdit,
  onValidate,
  lang = "fr",
}: Step5SummaryProps) {
  const [saving, setSaving] = useState(false);

  const handleValidate = async () => {
    setSaving(true);
    await onValidate();
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold">
          {lang === "ar" ? "الملخص" : "Récapitulatif"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {lang === "ar" ? "تحققي من قياساتك قبل التأكيد" : "Vérifiez vos mesures avant de valider"}
        </p>
      </div>

      {/* Silhouette */}
      <div className="w-48 h-64 mx-auto">
        <BodySilhouette className="w-full h-full" />
      </div>

      {/* Tableau des mesures */}
      <div className="glass-strong rounded-2xl p-6 space-y-3">
        {MEASUREMENT_FIELDS.map((field) => {
          const value = measurements[field.key];
          return (
            <div key={field.key} className="flex items-center justify-between">
              <span className="font-medium">{field[lang]}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{value?.toFixed(1)} {unit}</span>
                <button
                  onClick={() => onEdit(field.key)}
                  className="text-gold hover:text-gold-600"
                  aria-label="Modifier"
                >
                  ✏️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ajustement */}
      <div className="glass-strong rounded-2xl p-4">
        <div className="text-sm text-muted-foreground">
          {lang === "ar" ? "التعديل" : "Ajustement"}
        </div>
        <div className="font-semibold capitalize">{fit}</div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {lang === "ar" ? "ملاحظة (اختياري)" : "Note (optionnel)"}
        </label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={lang === "ar" ? "مثال: الكتف الأيمن أعرض قليلاً" : "Ex : épaule droite légèrement plus large"}
          className="w-full px-4 py-3 rounded-lg border-2 border-gold/30 bg-background"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Bouton valider */}
      <motion.button
        onClick={handleValidate}
        disabled={saving}
        className="btn-primary w-full"
        whileTap={{ scale: 0.98 }}
      >
        {saving
          ? lang === "ar"
            ? "...جارٍ الحفظ"
            : "Sauvegarde..."
          : lang === "ar"
          ? "تأكيد"
          : "Valider"}
      </motion.button>
    </div>
  );
}

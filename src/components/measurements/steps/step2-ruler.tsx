"use client";

// ─────────────────────────────────────────────────────────────
// Étape 2 : Règle tactile par mesure
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MeasurementRuler } from "../ui/measurement-ruler";
import { TapeAnimation } from "../ui/tape-animation";
import { MEASUREMENT_FIELDS, type MeasurementKey } from "@/lib/constants";
import type { MeasurementUnit } from "@/lib/measurements/types";

interface Step2RulerProps {
  zone: MeasurementKey;
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  unit?: MeasurementUnit;
  lang?: "fr" | "ar" | "kab";
}

const ZONE_LABELS: Record<MeasurementKey, { fr: string; ar: string; kab: string }> = {
  chest: { fr: "Tour de poitrine", ar: "محيط الصدر", kab: "Idmaren" },
  waist: { fr: "Tour de taille", ar: "محيط الخصر", kab: "Talalit" },
  hips: { fr: "Tour de hanches", ar: "محيط الوركين", kab: "Iqerqiben" },
  shoulders: { fr: "Largeur d'épaules", ar: "عرض الكتفين", kab: "Tehri n twririn" },
  sleeve: { fr: "Longueur de manche", ar: "طول الكم", kab: "Teɣzi n ufus" },
  length: { fr: "Longueur totale", ar: "الطول الكلي", kab: "Teɣzi meṛṛa" },
};

export function Step2Ruler({
  zone,
  value,
  onChange,
  onNext,
  onPrevious,
  unit = "cm",
  lang = "fr",
}: Step2RulerProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState(value.toString());

  const field = MEASUREMENT_FIELDS.find((f) => f.key === zone);
  if (!field) return null;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(field.max, localValue + 0.5);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(field.min, localValue - 0.5);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyboardSubmit = () => {
    const parsed = parseFloat(keyboardInput);
    if (!isNaN(parsed) && parsed >= field.min && parsed <= field.max) {
      setLocalValue(parsed);
      onChange(parsed);
      setShowKeyboard(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <button onClick={onPrevious} className="btn-secondary px-4">
          {lang === "ar" ? "←" : "→"}
        </button>
        <h2 className="text-xl font-display font-semibold">{ZONE_LABELS[zone][lang]}</h2>
        <button onClick={onNext} className="btn-primary px-4">
          {lang === "ar" ? "→" : "←"}
        </button>
      </div>

      {/* Animation */}
      <div className="w-40 h-40">
        <TapeAnimation zone={zone} className="w-full h-full" />
      </div>

      {/* Valeur en grand */}
      <motion.div
        className="text-6xl font-bold tabular-nums"
        key={localValue}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {localValue.toFixed(1)}
        <span className="text-3xl ml-2 text-muted-foreground">{unit}</span>
      </motion.div>

      {/* Règle */}
      <div className="w-full">
        <MeasurementRuler
          value={localValue}
          min={field.min}
          max={field.max}
          onChange={(v) => {
            setLocalValue(v);
            onChange(v);
          }}
          unit={unit}
          className="h-32"
        />
      </div>

      {/* Boutons +/− */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDecrement}
          className="btn-secondary w-12 h-12 text-2xl font-bold rounded-full"
          aria-label="Diminuer"
        >
          −
        </button>

        <button
          onClick={() => setShowKeyboard(true)}
          className="btn-outline px-6"
        >
          {lang === "ar" ? "إدخال بلوحة المفاتيح" : "Saisir au clavier"}
        </button>

        <button
          onClick={handleIncrement}
          className="btn-secondary w-12 h-12 text-2xl font-bold rounded-full"
          aria-label="Augmenter"
        >
          +
        </button>
      </div>

      {/* Plage conseillée */}
      <p className="text-sm text-muted-foreground">
        {lang === "ar"
          ? `المدى الموصى به: ${field.min}–${field.max} سم`
          : `Plage conseillée : ${field.min}–${field.max} cm`}
      </p>

      {/* Keyboard input modal */}
      {showKeyboard && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowKeyboard(false)}
        >
          <motion.div
            className="glass-strong rounded-2xl p-6 w-80"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4">
              {lang === "ar" ? "أدخلي القيمة" : "Entrez la valeur"}
            </h3>
            <input
              type="number"
              inputMode="decimal"
              value={keyboardInput}
              onChange={(e) => setKeyboardInput(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gold/30 bg-background text-lg"
              placeholder={lang === "ar" ? "مثال: 92" : "Exemple : 92"}
              style={{ fontSize: "16px" }} // Évite zoom iOS
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowKeyboard(false)}
                className="btn-secondary flex-1"
              >
                {lang === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button onClick={handleKeyboardSubmit} className="btn-primary flex-1">
                {lang === "ar" ? "تأكيد" : "Confirmer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 w-full max-w-sm mt-auto pb-8">
        <button onClick={onPrevious} className="btn-secondary flex-1">
          {lang === "ar" ? "التالي" : "Précédent"}
        </button>
        <button onClick={onNext} className="btn-primary flex-1">
          {lang === "ar" ? "السابق" : "Suivant"}
        </button>
      </div>
    </div>
  );
}

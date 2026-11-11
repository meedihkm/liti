"use client";

// ─────────────────────────────────────────────────────────────
// Étape 0 : Configuration (personne, méthode, ajustement)
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion } from "motion/react";
import type { MeasurementMethod, MeasurementFit, MeasurementUnit } from "@/lib/measurements/types";

interface Step0SetupProps {
  onComplete: (config: {
    person: string;
    method: MeasurementMethod;
    fit: MeasurementFit;
    unit: MeasurementUnit;
  }) => void;
  lang?: "fr" | "ar" | "kab";
}

export function Step0Setup({ onComplete, lang = "fr" }: Step0SetupProps) {
  const [person, setPerson] = useState<string>("self");
  const [method, setMethod] = useState<MeasurementMethod>("tape");
  const [fit, setFit] = useState<MeasurementFit>("comfortable");
  const [unit, setUnit] = useState<MeasurementUnit>("cm");

  const handleNext = () => {
    onComplete({ person, method, fit, unit });
  };

  return (
    <div className="flex flex-col gap-8 p-4 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold">
          {lang === "ar" ? "قبل البدء" : "Avant de commencer"}
        </h2>
      </div>

      {/* Pour qui */}
      <div>
        <h3 className="font-semibold mb-3">
          {lang === "ar" ? "لمن تأخذين هذه القياسات؟" : "Pour qui prenez-vous ces mesures ?"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "self", label: { fr: "Moi", ar: "لنفسي" } },
            { value: "daughter", label: { fr: "Ma fille", ar: "لابنتي" } },
            { value: "sister", label: { fr: "Ma sœur", ar: "لأختي" } },
            { value: "other", label: { fr: "Autre", ar: "آخر" } },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPerson(opt.value)}
              className={`btn-outline ${person === opt.value ? "!border-gold !bg-gold/10" : ""}`}
            >
              {opt.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Méthode */}
      <div>
        <h3 className="font-semibold mb-3">
          {lang === "ar" ? "كيف تريدين القياس؟" : "Comment voulez-vous mesurer ?"}
        </h3>
        <div className="space-y-2">
          {[
            { value: "tape" as const, label: { fr: "Avec un mètre ruban", ar: "بشريط قياس" } },
            { value: "dress" as const, label: { fr: "À partir d'une robe existante", ar: "من فستان موجود" } },
            { value: "estimation" as const, label: { fr: "Estimation taille/poids", ar: "تقدير الطول/الوزن" } },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMethod(opt.value)}
              className={`btn-outline w-full ${method === opt.value ? "!border-gold !bg-gold/10" : ""}`}
            >
              {opt.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Ajustement */}
      <div>
        <h3 className="font-semibold mb-3">
          {lang === "ar" ? "القصة المطلوبة" : "Coupe souhaitée"}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "fitted" as const, label: { fr: "Près du corps", ar: "ملاصق" } },
            { value: "comfortable" as const, label: { fr: "Confortable", ar: "مريح" } },
            { value: "loose" as const, label: { fr: "Ample", ar: "واسع" } },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFit(opt.value)}
              className={`btn-outline ${fit === opt.value ? "!border-gold !bg-gold/10" : ""}`}
            >
              {opt.label[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Unités */}
      <div>
        <h3 className="font-semibold mb-3">
          {lang === "ar" ? "الوحدات" : "Unités"}
        </h3>
        <div className="flex gap-3">
          {[
            { value: "cm" as const, label: "cm" },
            { value: "inches" as const, label: "pouces" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUnit(opt.value)}
              className={`btn-outline flex-1 ${unit === opt.value ? "!border-gold !bg-gold/10" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleNext} className="btn-primary w-full">
        {lang === "ar" ? "التالي" : "Commencer"}
      </button>
    </div>
  );
}

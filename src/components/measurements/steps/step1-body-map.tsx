"use client";

// ─────────────────────────────────────────────────────────────
// Étape 1 : Silhouette cliquable
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodySilhouette } from "../ui/body-silhouette";
import { TapeAnimation } from "../ui/tape-animation";
import { ProgressRing } from "../ui/progress-ring";
import { MEASUREMENT_FIELDS, type MeasurementKey } from "@/lib/constants";
import type { MeasurementValues } from "@/lib/measurements/types";

interface Step1BodyMapProps {
  measurements: Partial<MeasurementValues>;
  onMeasureZone: (zone: MeasurementKey) => void;
  onNext: () => void;
  lang?: "fr" | "ar" | "kab";
}

const INSTRUCTIONS: Record<MeasurementKey, { fr: string; ar: string; kab: string }> = {
  chest: {
    fr: "Le mètre passe sous les bras, au point le plus fort de la poitrine",
    ar: "يمر الشريط تحت الإبطين، عند أوسع نقطة من الصدر",
    kab: "Ameṭṭu yettuɛeddi ddaw n yifassen, deg uxxam ameqqran n yidmaren",
  },
  waist: {
    fr: "Au creux naturel de la taille, juste au-dessus du nombril",
    ar: "عند الخصر الطبيعي، فوق السرّة مباشرة",
    kab: "Deg tlalit tagejdant, nnig n tbuṭṭ",
  },
  hips: {
    fr: "À l'endroit le plus large des hanches, pieds joints",
    ar: "عند أوسع نقطة من الوركين، والقدمان مضمومتان",
    kab: "Deg wadeg ameqqran n yiqerqiben, iḍarren idduklen",
  },
  shoulders: {
    fr: "Dans le dos, d'un bout à l'autre des épaules",
    ar: "من الخلف، من طرف إلى طرف بين عظمتي الكتف",
    kab: "Deg uzaglu, seg yiwet n tawrirt ɣer tayeḍ",
  },
  sleeve: {
    fr: "Du sommet de l'épaule jusqu'au poignet, bras légèrement plié",
    ar: "من قمة الكتف حتى المعصم، والذراع مثنية قليلاً",
    kab: "Seg ufella n twrirt ar uɣil, afus yeddukkel cwiṭ",
  },
  length: {
    fr: "Du haut de l'épaule jusqu'à l'ourlet souhaité",
    ar: "من أعلى الكتف حتى الذيل المطلوب",
    kab: "Seg ufella n twrirt ar teɣzi i tebɣiḍ",
  },
};

const ZONE_LABELS: Record<MeasurementKey, { fr: string; ar: string; kab: string }> = {
  chest: { fr: "Tour de poitrine", ar: "محيط الصدر", kab: "Idmaren" },
  waist: { fr: "Tour de taille", ar: "محيط الخصر", kab: "Talalit" },
  hips: { fr: "Tour de hanches", ar: "محيط الوركين", kab: "Iqerqiben" },
  shoulders: { fr: "Largeur d'épaules", ar: "عرض الكتفين", kab: "Tehri n twririn" },
  sleeve: { fr: "Longueur de manche", ar: "طول الكم", kab: "Teɣzi n ufus" },
  length: { fr: "Longueur totale", ar: "الطول الكلي", kab: "Teɣzi meṛṛa" },
};

export function Step1BodyMap({ measurements, onMeasureZone, onNext, lang = "fr" }: Step1BodyMapProps) {
  const [selectedZone, setSelectedZone] = useState<MeasurementKey | null>(null);

  const completedZones = new Set(
    Object.keys(measurements).filter((k) => measurements[k as MeasurementKey] !== undefined) as MeasurementKey[]
  );

  const totalRequired = MEASUREMENT_FIELDS.length;
  const completed = completedZones.size;

  const handleZoneClick = (zone: MeasurementKey) => {
    setSelectedZone(zone);
  };

  const handleMeasure = () => {
    if (selectedZone) {
      onMeasureZone(selectedZone);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Titre */}
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold">
          {lang === "ar" ? "المناطق المطلوب قياسها" : lang === "kab" ? "Tiɣzirin ara yettumsinen" : "Zones à mesurer"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "ar" ? "اضغطي على منطقة للبدء" : lang === "kab" ? "Sit ɣef teɣzirt i tebɣiḍ ad tebduḍ" : "Tapez sur une zone pour commencer"}
        </p>
      </div>

      {/* Progression */}
      <ProgressRing current={completed} total={totalRequired} />

      {/* Silhouette */}
      <div className="relative w-full max-w-sm">
        <BodySilhouette
          activeZone={selectedZone}
          completedZones={completedZones}
          onZoneClick={handleZoneClick}
          className="w-full"
        />

        {/* Animation tape si zone sélectionnée */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TapeAnimation zone={selectedZone} className="w-full h-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions pour zone sélectionnée */}
      <AnimatePresence mode="wait">
        {selectedZone && (
          <motion.div
            key={selectedZone}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong w-full max-w-sm rounded-2xl p-6 text-center"
          >
            <h3 className="font-semibold text-lg mb-2">{ZONE_LABELS[selectedZone][lang]}</h3>
            <p className="text-sm text-muted-foreground mb-4">{INSTRUCTIONS[selectedZone][lang]}</p>
            <button
              onClick={handleMeasure}
              className="btn-primary w-full"
            >
              {lang === "ar" ? "قياس" : lang === "kab" ? "Tkil" : "Mesurer"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des zones */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {MEASUREMENT_FIELDS.map((field) => {
          const isCompleted = completedZones.has(field.key);
          return (
            <button
              key={field.key}
              onClick={() => handleZoneClick(field.key)}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                selectedZone === field.key
                  ? "border-blue-500 bg-blue-500/10"
                  : isCompleted
                  ? "border-green-500 bg-green-500/10"
                  : "border-gold/30 bg-background/50"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  isCompleted ? "border-green-500 bg-green-500" : "border-gold"
                }`}
              >
                {isCompleted && (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{field[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Bouton Suivant */}
      {completed === totalRequired && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onNext}
          className="btn-primary w-full max-w-sm mt-4"
        >
          {lang === "ar" ? "التالي" : lang === "kab" ? "Ɣer zdat" : "Suivant"}
        </motion.button>
      )}
    </div>
  );
}

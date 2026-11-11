"use client";

// ─────────────────────────────────────────────────────────────
// Wizard principal de prise de mesures
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Step0Setup } from "./steps/step0-setup";
import { Step1BodyMap } from "./steps/step1-body-map";
import { Step2Ruler } from "./steps/step2-ruler";
import { Step4Validation } from "./steps/step4-validation";
import { Step5Summary } from "./steps/step5-summary";
import type { MeasurementValues, MeasurementFit, MeasurementUnit, MeasurementMethod, MeasurementKey } from "@/lib/measurements/types";

interface MeasurementWizardProps {
  onComplete: (data: {
    measurements: MeasurementValues;
    fit: MeasurementFit;
    unit: MeasurementUnit;
    method: MeasurementMethod;
    note: string;
  }) => void;
  lang?: "fr" | "ar";
}

export function MeasurementWizard({ onComplete, lang = "fr" }: MeasurementWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<{
    person: string;
    method: MeasurementMethod;
    fit: MeasurementFit;
    unit: MeasurementUnit;
  } | null>(null);

  const [measurements, setMeasurements] = useState<Partial<MeasurementValues>>({});
  const [confirmed, setConfirmed] = useState<Partial<Record<MeasurementKey, boolean>>>({});
  const [note, setNote] = useState("");
  const [currentZone, setCurrentZone] = useState<MeasurementKey | null>(null);

  const handleSetupComplete = (setupConfig: typeof config) => {
    setConfig(setupConfig);
    setStep(1);
  };

  const handleMeasureZone = (zone: MeasurementKey) => {
    setCurrentZone(zone);
    setStep(2);
  };

  const handleMeasurementChange = (value: number) => {
    if (currentZone) {
      setMeasurements((prev) => ({ ...prev, [currentZone]: value }));
    }
  };

  const handleNext = () => {
    if (step === 2) {
      // Retour à la silhouette
      setStep(1);
      setCurrentZone(null);

      // Si toutes les mesures sont prises, aller à validation
      if (Object.keys(measurements).length === 6) {
        setStep(4);
      }
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleValidate = async () => {
    if (!config) return;

    await onComplete({
      measurements: measurements as MeasurementValues,
      fit: config.fit,
      unit: config.unit,
      method: config.method,
      note,
    });
  };

  if (step === 0) {
    return <Step0Setup onComplete={handleSetupComplete} lang={lang} />;
  }

  if (step === 1) {
    return (
      <Step1BodyMap
        measurements={measurements}
        onMeasureZone={handleMeasureZone}
        onNext={() => setStep(4)}
        lang={lang}
      />
    );
  }

  if (step === 2 && currentZone) {
    return (
      <Step2Ruler
        zone={currentZone}
        value={measurements[currentZone] || 90}
        onChange={handleMeasurementChange}
        onNext={handleNext}
        onPrevious={() => setStep(1)}
        unit={config?.unit}
        lang={lang}
      />
    );
  }

  if (step === 4) {
    return (
      <Step4Validation
        measurements={measurements}
        confirmed={confirmed}
        onConfirm={(field) => setConfirmed((prev) => ({ ...prev, [field]: true }))}
        onRecheck={(field) => {
          setCurrentZone(field);
          setStep(2);
        }}
        onNext={() => setStep(5)}
        lang={lang}
      />
    );
  }

  if (step === 5 && config) {
    return (
      <Step5Summary
        measurements={measurements as MeasurementValues}
        fit={config.fit}
        unit={config.unit}
        note={note}
        onNoteChange={setNote}
        onEdit={(field) => {
          setCurrentZone(field as MeasurementKey);
          setStep(2);
        }}
        onValidate={handleValidate}
        lang={lang}
      />
    );
  }

  return null;
}

"use client";

// ─────────────────────────────────────────────────────────────
// Règle tactile interactive avec drag/scroll
// ─────────────────────────────────────────────────────────────

import { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MEASUREMENT_CONFIG } from "@/lib/measurements/rules";

interface MeasurementRulerProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  unit?: "cm" | "inches";
  className?: string;
}

export function MeasurementRuler({
  value,
  min,
  max,
  onChange,
  unit = "cm",
  className = "",
}: MeasurementRulerProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const lastVibrateRef = useRef(0);

  // Convertir position → valeur
  const currentValue = useTransform(x, (latest) => {
    const pixelsPerUnit = 40; // 40px par unité
    const offset = -latest / pixelsPerUnit;
    const newValue = Math.round((value + offset) * 2) / 2; // Arrondi au 0.5
    return Math.max(min, Math.min(max, newValue));
  });

  // Vibration au changement d'unité entière
  useEffect(() => {
    const unsubscribe = currentValue.on("change", (v) => {
      const intValue = Math.floor(v);
      if (
        intValue !== lastVibrateRef.current &&
        MEASUREMENT_CONFIG.vibration.enabled &&
        navigator.vibrate
      ) {
        const now = Date.now();
        if (now - lastVibrateRef.current > MEASUREMENT_CONFIG.vibration.interval) {
          navigator.vibrate(MEASUREMENT_CONFIG.vibration.duration);
          lastVibrateRef.current = intValue;
        }
      }
    });

    return () => unsubscribe();
  }, [currentValue]);

  // Mettre à jour la valeur parent
  const handleDragEnd = () => {
    const finalValue = currentValue.get();
    onChange(finalValue);
    x.set(0); // Reset position
  };

  // Générer les graduations
  const ticks = [];
  for (let i = min; i <= max; i += 0.5) {
    const isWhole = i % 1 === 0;
    ticks.push(
      <div
        key={i}
        className="absolute flex flex-col items-center"
        style={{ left: `${(i - value) * 40 + 150}px` }}
      >
        <div className={`w-px ${isWhole ? "h-6 bg-gold" : "h-3 bg-gold/50"}`} />
        {isWhole && (
          <span className="mt-1 text-xs text-muted-foreground">{Math.round(i)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} ref={constraintsRef}>
      {/* Curseur central */}
      <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center">
        <div className="w-0.5 h-16 bg-blue-500" />
        <div className="w-4 h-4 -mt-2 rotate-45 bg-blue-500" />
      </div>

      {/* Règle draggable */}
      <motion.div
        className="relative h-24 touch-none cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -1000, right: 1000 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        data-testid="measurement-ruler"
      >
        <div className="relative h-full">{ticks}</div>
      </motion.div>

      {/* Affichage valeur en cours */}
      <motion.div
        className="absolute inset-x-0 bottom-0 text-center text-sm font-medium text-blue-500"
        style={{ opacity: useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]) }}
      >
        {currentValue.get().toFixed(1)} {unit}
      </motion.div>
    </div>
  );
}

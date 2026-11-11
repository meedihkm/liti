"use client";

// ─────────────────────────────────────────────────────────────
// Silhouette SVG avec zones cliquables
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import type { MeasurementKey } from "@/lib/constants";

interface BodySilhouetteProps {
  activeZone?: MeasurementKey | null;
  completedZones?: Set<MeasurementKey>;
  onZoneClick?: (zone: MeasurementKey) => void;
  className?: string;
}

const ZONES: { key: MeasurementKey; path: string; cx: number; cy: number }[] = [
  { key: "shoulders", path: "M100,80 L160,80", cx: 130, cy: 70 },
  { key: "chest", path: "M100,120 Q130,125 160,120", cx: 130, cy: 125 },
  { key: "waist", path: "M110,160 Q130,165 150,160", cx: 130, cy: 165 },
  { key: "hips", path: "M105,200 Q130,205 155,200", cx: 130, cy: 205 },
  { key: "sleeve", path: "M70,100 L70,180", cx: 55, cy: 140 },
  { key: "length", path: "M220,80 L220,280", cx: 235, cy: 180 },
];

export function BodySilhouette({
  activeZone,
  completedZones = new Set(),
  onZoneClick,
  className = "",
}: BodySilhouetteProps) {
  return (
    <svg
      viewBox="0 0 300 320"
      className={`${className} select-none`}
      aria-label="Silhouette pour prise de mesures"
    >
      {/* Silhouette de base */}
      <g stroke="#d4af37" strokeWidth="2" fill="none" opacity="0.3">
        {/* Tête */}
        <circle cx="130" cy="40" r="20" />
        {/* Cou */}
        <line x1="130" y1="60" x2="130" y2="75" />
        {/* Épaules */}
        <line x1="100" y1="80" x2="160" y2="80" />
        {/* Bras gauche */}
        <path d="M100,80 Q70,100 70,180 L70,200" />
        {/* Bras droit */}
        <path d="M160,80 Q190,100 190,180 L190,200" />
        {/* Torse */}
        <path d="M100,80 L100,120 Q100,160 110,160 L110,200 Q110,220 105,240 L105,280" />
        <path d="M160,80 L160,120 Q160,160 150,160 L150,200 Q150,220 155,240 L155,280" />
        {/* Hanches/Jupe */}
        <ellipse cx="130" cy="200" rx="25" ry="15" />
        {/* Jambes */}
        <line x1="115" y1="280" x2="115" y2="310" />
        <line x1="145" y1="280" x2="145" y2="310" />
      </g>

      {/* Zones interactives */}
      {ZONES.map((zone) => {
        const isActive = activeZone === zone.key;
        const isCompleted = completedZones.has(zone.key);

        return (
          <g key={zone.key}>
            {/* Ligne de mesure */}
            <motion.path
              d={zone.path}
              stroke={isActive ? "#3b82f6" : isCompleted ? "#10b981" : "#d4af37"}
              strokeWidth={isActive ? 3 : 2}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Zone cliquable */}
            <motion.circle
              cx={zone.cx}
              cy={zone.cy}
              r={isActive ? 25 : 20}
              fill="transparent"
              stroke={isActive ? "#3b82f6" : isCompleted ? "#10b981" : "#d4af37"}
              strokeWidth={isActive ? 2 : 1.5}
              className="cursor-pointer"
              onClick={() => onZoneClick?.(zone.key)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                opacity: isActive ? [0.3, 0.6, 0.3] : isCompleted ? 0.5 : 0.3,
              }}
              transition={{
                opacity: isActive ? { repeat: Infinity, duration: 1.5 } : undefined,
              }}
              aria-label={zone.key}
              role="button"
              tabIndex={0}
            />

            {/* Checkmark si complété */}
            {isCompleted && !isActive && (
              <motion.path
                d={`M${zone.cx - 5},${zone.cy} L${zone.cx - 2},${zone.cy + 4} L${zone.cx + 5},${zone.cy - 4}`}
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

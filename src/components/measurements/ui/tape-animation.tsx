"use client";

// ─────────────────────────────────────────────────────────────
// Animation mètre ruban qui s'enroule autour d'une zone
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import type { MeasurementKey } from "@/lib/constants";

interface TapeAnimationProps {
  zone: MeasurementKey;
  className?: string;
}

export function TapeAnimation({ zone, className = "" }: TapeAnimationProps) {
  // Animation simplifiée : mètre ruban qui apparaît et pulse
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: [0, 1, 1, 1],
      transition: {
        pathLength: { duration: 1.2, ease: "easeInOut" },
        opacity: { duration: 0.3 },
      },
    },
    loop: {
      opacity: [1, 0.6, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
      },
    },
  };

  // Paths différents par zone (simplifié pour démo)
  const paths: Record<MeasurementKey, string> = {
    chest: "M 50,100 Q 130,115 210,100",
    waist: "M 60,140 Q 130,155 200,140",
    hips: "M 55,180 Q 130,195 205,180",
    shoulders: "M 80,60 L 180,60",
    sleeve: "M 30,80 L 30,160",
    length: "M 220,60 L 220,260",
  };

  return (
    <svg viewBox="0 0 260 320" className={`${className} pointer-events-none`}>
      <defs>
        <pattern id="tape-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="5" height="10" fill="#f59e0b" />
          <rect x="5" width="5" height="10" fill="#fbbf24" />
        </pattern>
      </defs>

      <motion.path
        d={paths[zone]}
        stroke="url(#tape-pattern)"
        strokeWidth="8"
        fill="none"
        variants={pathVariants}
        initial="hidden"
        animate={["visible", "loop"]}
      />
    </svg>
  );
}

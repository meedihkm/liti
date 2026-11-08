"use client";

import { useEffect, useRef } from "react";
import { formatDA } from "@/lib/pricing";

// ─────────────────────────────────────────────────────────────
// Prix animé (compteur) — interpole la valeur affichée quand le
// prix change (configurateur). Animation 100 % DOM via ref :
// aucune re-render React par frame, respecte prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────

export function PriceCounter({
  amount,
  lang,
  className,
}: {
  amount: number
  lang: "fr" | "ar"
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const currentRef = useRef(amount)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = currentRef.current
    const to = amount
    if (from === to) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      currentRef.current = to
      el.textContent = formatDA(to, lang)
      return
    }

    let raf = 0
    const duration = 450
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const value = Math.round(from + (to - from) * eased)
      el.textContent = formatDA(value, lang)
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        currentRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [amount, lang])

  return (
    <span ref={ref} className={className} aria-live="polite">
      {formatDA(amount, lang)}
    </span>
  )
}

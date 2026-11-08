"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// Curseur personnalisé discret — desktop uniquement (pointer fine),
// jamais sur mobile/tactile ni prefers-reduced-motion. Point doré +
// anneau suiveur (lerp rAF), grossit sur les éléments interactifs.
// 100 % manipulation DOM (aucun setState) → zéro re-render React.
// ─────────────────────────────────────────────────────────────

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const lowEnd =
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4
    if (!fine || reduced || lowEnd) return

    document.documentElement.classList.add("cursor-fine")

    const pos = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let hovering = false
    let raf = 0

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const target = e.target as HTMLElement | null
      hovering = !!target?.closest("a, button, [role='button'], input[type='range'], .cursor-zone")
    }

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.16
      ring.y += (pos.y - ring.y) * 0.16
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`
        dotRef.current.style.opacity = "1"
      }
      if (ringRef.current) {
        const scale = hovering ? 1.7 : 1
        ringRef.current.style.transform = `translate3d(${ring.x - 18}px, ${ring.y - 18}px, 0) scale(${scale})`
        ringRef.current.style.opacity = hovering ? "0.9" : "0.55"
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    raf = requestAnimationFrame(loop)

    return () => {
      document.documentElement.classList.remove("cursor-fine")
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-gold opacity-0"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border border-gold/70 opacity-0"
      />
    </>
  )
}

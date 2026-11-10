"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// Fond de particules signature — losanges dorés dérivant
// lentement (canvas léger, ~40 particules). Désactivé si
// prefers-reduced-motion, save-data ou appareil faible.
// Uniquement transform/opacity via dessin canvas 60 fps.
// Arrêté automatiquement hors écran (Intersection Observer).
// ─────────────────────────────────────────────────────────────

interface Particle {
  x: number
  y: number
  size: number
  speed: number
  drift: number
  opacity: number
  phase: number
}

export function ParticlesBackground({ density = 34 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
      true
    const lowMemory =
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4 ||
      (navigator.hardwareConcurrency ?? 8) <= 4

    // Mode léger : désactiver sur reduced-motion, save-data, appareils faibles
    if (reduced || saveData || lowMemory) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let raf = 0
    let visible = true
    let inView = false
    let particles: Particle[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: (2 + Math.random() * 4) * dpr,
        speed: (0.08 + Math.random() * 0.22) * dpr,
        drift: (Math.random() - 0.5) * 0.18 * dpr,
        opacity: 0.12 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (time: number) => {
      // Arrêter l'animation si hors écran ou page cachée
      if (!visible || !inView) {
        raf = requestAnimationFrame(draw)
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const gold = getComputedStyle(canvas).color || "#E8B64C"
      for (const p of particles) {
        p.y -= p.speed
        p.x += p.drift + Math.sin(time / 2400 + p.phase) * 0.15 * dpr
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        // Losange (motif berbère minimal)
        const s = p.size
        const pulse = 0.75 + 0.25 * Math.sin(time / 1600 + p.phase)
        ctx.save()
        ctx.globalAlpha = p.opacity * pulse
        ctx.strokeStyle = gold
        ctx.lineWidth = 1 * dpr
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - s)
        ctx.lineTo(p.x + s * 0.7, p.y)
        ctx.lineTo(p.x, p.y + s)
        ctx.lineTo(p.x - s * 0.7, p.y)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      visible = document.visibilityState === "visible"
    }

    // Intersection Observer pour arrêter l'animation hors écran
    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
      },
      { rootMargin: "100px" }
    )

    resize()
    raf = requestAnimationFrame(draw)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    observer.observe(canvas)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-gold"
      style={{ contentVisibility: "auto", contain: "layout style paint" }}
    />
  )
}

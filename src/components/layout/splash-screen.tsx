"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { YazMark } from "./berber-divider";

// ─────────────────────────────────────────────────────────────
// Intro splash (premier chargement uniquement, < 1.4 s, ignorable
// via sessionStorage) : le yaz ⵣ se dessine puis fade-out.
// Désactivée si prefers-reduced-motion. Le setShow initial est
// différé d'une frame (callback rAF) — jamais synchrone dans
// l'effet (règle react-hooks/set-state-in-effect).
// ─────────────────────────────────────────────────────────────

export function SplashScreen() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let seen = false
    try {
      seen = !!sessionStorage.getItem("rk-intro")
    } catch {}
    if (seen || reduced) return

    // Affichage différé d'une frame (asynchrone → conforme)
    const raf = requestAnimationFrame(() => setShow(true))
    const timer = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem("rk-intro", "1")
      } catch {}
    }, 1300)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <span className="text-gold">
              <YazMark className="h-16 w-16" />
            </span>
            <span className="font-display text-sm uppercase tracking-[0.35em] text-muted-foreground">
              Taqendurt
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

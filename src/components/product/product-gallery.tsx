"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { SmartImage } from "@/components/layout/smart-image";
import type { ProductImageDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Galerie produit — vignettes, vue principale avec voile teinté
// de la couleur choisie (crossfade), zoom : hover desktop avec
// suivi du pointeur, clic → visionneuse plein écran.
// ─────────────────────────────────────────────────────────────

export function ProductGallery({
  images,
  title,
  colorHex,
  layoutId,
  priority = false,
}: {
  images: ProductImageDTO[]
  title: string
  colorHex?: string
  layoutId?: string
  priority?: boolean
}) {
  const { t, lang } = useI18n()
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState("50% 50%")

  const list = images.length ? images : [{ id: "x", url: "/images/products/p1.jpg", alt: title, order: 0 }]
  const current = list[Math.min(active, list.length - 1)]
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom || reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  const go = (dir: 1 | -1) => {
    setActive((a) => (a + dir + list.length) % list.length)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Image principale */}
      <div
        className="glass glow-gold group relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-[1.75rem]"
        onClick={() => setLightbox(true)}
        onMouseMove={onMove}
        onMouseEnter={() => !reduced && setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        role="button"
        aria-label={t("product.gallery.open")}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setLightbox(true)}
      >
        <motion.div layoutId={layoutId} className="absolute inset-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={current.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <SmartImage
                src={current.url}
                alt={current.alt || title}
                className="h-full w-full"
                imgClassName={cn(
                  "transition-transform duration-500",
                  zoom && !reduced ? "scale-[1.8]" : "scale-100"
                )}
                priority={priority}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          </AnimatePresence>
          {/* Teinte de la couleur choisie (crossfade) */}
          <AnimatePresence>
            {colorHex && (
              <motion.div
                key={colorHex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.22 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute inset-0 mix-blend-color"
                style={{ backgroundColor: colorHex, transformOrigin: origin }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Indicateur zoom */}
        <span className="glass-strong pointer-events-none absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ZoomIn className="h-4.5 w-4.5" />
        </span>

        {/* Flèches (si plusieurs images) */}
        {list.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                go(-1)
              }}
              aria-label={lang === "ar" ? "السابق" : "Image précédente"}
              className="glass-strong absolute start-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-gold"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                go(1)
              }}
              aria-label={lang === "ar" ? "التالي" : "Image suivante"}
              className="glass-strong absolute end-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-gold"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </>
        )}

        <span className="glass-strong absolute bottom-3 start-4 rounded-full px-3 py-1 text-[11px] text-muted-foreground">
          {active + 1} / {list.length} · {t("product.gallery.zoom")}
        </span>
      </div>

      {/* Vignettes */}
      {list.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scroll-slim" role="tablist" aria-label={title}>
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              className={cn(
                "relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300",
                i === active
                  ? "border-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_20%,transparent)]"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <SmartImage src={img.url} alt={img.alt || title} className="h-full w-full" sizes="80px" quality={60} />
            </button>
          ))}
        </div>
      )}

      {/* Visionneuse plein écran */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <button
              className="absolute end-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label={t("common.actions.close")}
              onClick={() => setLightbox(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-[3/4] max-h-[90vh] w-auto max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={current.url}
                alt={current.alt || title}
                className="h-full w-full rounded-2xl object-contain"
              />
            </motion.div>
            {list.length > 1 && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                {list.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActive(i)}
                    aria-label={`Image ${i + 1}`}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all",
                      i === active ? "scale-125 bg-gold" : "bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

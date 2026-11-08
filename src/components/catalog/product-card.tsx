"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { SmartImage } from "@/components/layout/smart-image";
import type { ProductDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Carte produit — glass, hover glow/lift, layoutId pour la
// transition partagée vers la page produit, stagger au scroll.
// ─────────────────────────────────────────────────────────────

export function ProductCard({
  product,
  index = 0,
  className,
}: {
  product: ProductDTO
  index?: number
  className?: string
}) {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const title = L(product, "title")
  const image = product.images[0]?.url ?? "/images/products/p1.jpg"
  const alt = product.images[0]?.alt || title

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={cn("group cursor-pointer", className)}
      onClick={() => navigate(`/product/${product.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate(`/product/${product.id}`)
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`${title} — ${formatDA(product.basePrice, lang)}`}
    >
      <div className="glass lift-hover glow-gold-hover relative overflow-hidden rounded-2xl">
        {/* Image — layoutId pour la transition partagée grille → fiche */}
        <motion.div layoutId={`product-image-${product.id}`} className="relative aspect-[3/4]">
          <SmartImage
            src={image}
            alt={alt}
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          />
          {/* Voile + halo au survol */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
          {/* Badge coup de cœur */}
          {product.featured && (
            <span className="absolute start-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold backdrop-blur-sm">
              ★ {lang === "ar" ? "مميز" : "Coup de cœur"}
            </span>
          )}
        </motion.div>

        {/* Contenu */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-base font-semibold leading-tight text-white drop-shadow sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-white/70">
            {product.category ? L(product.category, "name") : ""}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gold">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-white/60">
                {t("common.misc.from")}
              </span>
              {formatDA(product.basePrice, lang)}
            </p>
            <span className="flex h-9 items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 text-xs font-semibold text-gold opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
              {t("catalog.view")}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

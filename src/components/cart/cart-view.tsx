"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus, Ruler } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { formatDA } from "@/lib/pricing";
import { useCart, cartSubtotal, type CartItem } from "./cart-store";
import { SmartImage } from "@/components/layout/smart-image";
import { MEASUREMENT_FIELDS } from "@/lib/constants";
import { useMounted } from "@/hooks/use-mounted";

// ─────────────────────────────────────────────────────────────
// Panier — lignes avec récapitulatif complet de la configuration,
// steppers quantité, suppression animée, sous-total estimé.
// ─────────────────────────────────────────────────────────────

function CartLineCard({ item, index }: { item: CartItem; index: number }) {
  const { t, lang } = useI18n()
  const { navigate } = useRouter()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)

  const title = lang === "ar" ? item.productTitleAr : item.productTitle
  const fabric = lang === "ar" ? item.fabricNameAr : item.fabricName
  const color = lang === "ar" ? item.colorNameAr : item.colorName
  const embroideries = (lang === "ar" ? item.embroideryNamesAr : item.embroideryNames) ?? []
  const isCustom = item.size === "sur-mesure"

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="glass overflow-hidden rounded-2xl"
    >
      <div className="flex gap-4 p-4">
        {/* Vignette cliquable → produit */}
        <button
          onClick={() => navigate(`/product/${item.productId}`)}
          className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl"
          aria-label={title}
        >
          <SmartImage src={item.productImage || "/images/products/p1.jpg"} alt={title} className="h-full w-full" sizes="96px" quality={60} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button onClick={() => navigate(`/product/${item.productId}`)} className="text-start">
              <h3 className="font-display text-base font-semibold leading-tight hover:text-gold">
                {title}
              </h3>
            </button>
            <button
              onClick={() => remove(item.id)}
              aria-label={t("checkout.cart.remove")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Récapitulatif configuration */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            {fabric && (
              <span className="rounded-full border border-border bg-card px-2 py-0.5">
                {t("checkout.cart.fabric")}: {fabric}
              </span>
            )}
            {color && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5">
                <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: item.colorHex }} />
                {color}
              </span>
            )}
            <span className={`rounded-full border px-2 py-0.5 ${isCustom ? "border-gold/50 text-gold" : "border-border"}`}>
              {isCustom ? (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {t("checkout.cart.custom")}
                </span>
              ) : (
                `${t("checkout.cart.size")}: ${item.size}`
              )}
            </span>
            {item.length && (
              <span className="rounded-full border border-border bg-card px-2 py-0.5">
                {t("checkout.cart.length")}: {item.length}
              </span>
            )}
            {embroideries.map((e) => (
              <span key={e} className="rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 text-gold">
                {e}
              </span>
            ))}
          </div>

          {/* Mesures (sur-mesure) */}
          {isCustom && item.measurements && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-medium text-gold">
                {t("checkout.cart.measurements")} ({Object.keys(item.measurements).length})
              </summary>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {MEASUREMENT_FIELDS.filter((f) => item.measurements?.[f.key] !== undefined).map((f) => (
                  <span key={f.key} className="rounded bg-muted px-1.5 py-0.5 tabular-nums">
                    {(lang === "ar" ? f.ar : f.fr).slice(0, 12)}: {item.measurements?.[f.key]}
                  </span>
                ))}
              </div>
            </details>
          )}

          {item.note && (
            <p className="mt-2 truncate text-[11px] italic text-muted-foreground">“{item.note}”</p>
          )}

          {/* Quantité + total ligne */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(item.id, item.quantity - 1)}
                aria-label="-"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-gold/50"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center font-display text-sm font-bold tabular-nums">
                {item.quantity}
              </span>
              <button
                onClick={() => setQty(item.id, item.quantity + 1)}
                aria-label="+"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-gold/50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-end">
              <span className="block text-[10px] text-muted-foreground">
                {formatDA(item.unitPrice, lang)} × {item.quantity}
              </span>
              <span className="font-display text-base font-bold text-gold">
                {formatDA(item.unitPrice * item.quantity, lang)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

export function CartView() {
  const { t, lang } = useI18n()
  const { navigate } = useRouter()
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const mounted = useMounted()

  const subtotal = cartSubtotal(items)

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span className="glass flex h-20 w-20 items-center justify-center rounded-full text-gold">
          <ShoppingBag className="h-9 w-9" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">{t("checkout.cart.empty")}</h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.cart.emptyHint")}</p>
        <button
          onClick={() => navigate("/catalog")}
          className="mt-8 flex h-12 items-center gap-2 rounded-full bg-gold px-8 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          {t("checkout.cart.emptyCta")}
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t("checkout.cart.title")}</h1>
        <button
          onClick={() => {
            clear()
          }}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-red-400 hover:underline"
        >
          {t("checkout.cart.clear")}
        </button>
      </motion.div>

      <ul className="mt-6 flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <CartLineCard key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
      </ul>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong glow-gold mt-6 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("common.misc.subtotal")}</span>
          <span className="font-semibold tabular-nums">{formatDA(subtotal, lang)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("common.misc.shipping")}</span>
          <span className="text-muted-foreground">{t("checkout.cart.shippingCalculated")}</span>
        </div>
        <div className="my-4 h-px bg-border" />
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium">{t("checkout.form.summary")}</span>
          <span className="font-display text-2xl font-bold text-gold tabular-nums">
            {formatDA(subtotal, lang)}
          </span>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--gold)_60%,transparent)] transition-transform hover:-translate-y-0.5"
        >
          {t("checkout.cart.checkout")}
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button
          onClick={() => navigate("/catalog")}
          className="mt-3 w-full text-center text-xs font-medium text-muted-foreground hover:text-gold"
        >
          {t("checkout.cart.continueShopping")}
        </button>
      </motion.div>
    </section>
  )
}

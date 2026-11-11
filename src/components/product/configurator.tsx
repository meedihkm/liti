"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Ruler, Minus, Plus, ShoppingBag, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { computeUnitPrice, formatDA } from "@/lib/pricing";
import { useCart } from "@/components/cart/cart-store";
import { PriceCounter } from "./price-counter";
import { SmartImage } from "@/components/layout/smart-image";
import { STANDARD_SIZES, MEASUREMENT_FIELDS, LENGTHS } from "@/lib/constants";
import type { ProductDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// CONFIGURATEUR — cœur du projet. Tissu → couleur → taille (ou
// sur-mesure) → broderie → finitions. Prix live animé, barre de
// progression (scaleX uniquement), ajout panier avec animation
// « vol » vers l'icône panier, commande directe WhatsApp.
// Le prix affiché est une estimation : le serveur recalcule.
// ─────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const

function Section({
  step,
  title,
  hint,
  done,
  children,
}: {
  step: number
  title: string
  hint?: string
  done?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE }}
      className="glass rounded-2xl p-5"
    >
      <header className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold transition-colors",
            done ? "border-gold bg-gold text-primary-foreground" : "border-gold/40 text-gold"
          )}
        >
          {done ? <Check className="h-4 w-4" /> : step}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-tight">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  )
}

export function Configurator({
  product,
  onColorHexChange,
}: {
  product: ProductDTO
  onColorHexChange?: (hex: string | undefined) => void
}) {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const { whatsappLink } = usePublicData()
  const addItem = useCart((s) => s.add)

  // ── État de configuration ──
  const [fabricId, setFabricId] = useState(product.fabrics[0]?.id ?? "")
  const [colorId, setColorId] = useState("")
  const [size, setSize] = useState("")
  const [measurements, setMeasurements] = useState<Record<string, number>>({})
  const [length, setLength] = useState("")
  const [embroideryIds, setEmbroideryIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [eventDate, setEventDate] = useState("")
  const [note, setNote] = useState("")
  const [added, setAdded] = useState(false)
  const [flyKey, setFlyKey] = useState(0)

  // ── Disponibilités tissu ↔ couleur ──
  const fabricConfig = product.fabrics.find((f) => f.id === fabricId)
  const availableColors = useMemo(() => {
    const ids = fabricConfig?.colorIds ?? []
    return product.colors.filter((c) => ids.length === 0 || ids.includes(c.id))
  }, [product.colors, fabricConfig])

  // Couleur valide au changement de tissu
  const effectiveColor = availableColors.find((c) => c.id === colorId) ?? availableColors[0]
  const effectiveColorId = effectiveColor?.id ?? ""

  const selectFabric = (id: string) => {
    setFabricId(id)
    const fc = product.fabrics.find((f) => f.id === id)
    const ids = fc?.colorIds ?? []
    const stillOk = product.colors.find((c) => c.id === colorId && (ids.length === 0 || ids.includes(c.id)))
    if (!stillOk) setColorId("")
  }

  // ── Prix live ──
  const isCustom = size === "sur-mesure"
  const selectedEmbroideries = product.embroideries.filter((e) => embroideryIds.includes(e.id))
  const fabricExtra = fabricConfig?.productExtra ?? 0
  const extras = fabricExtra + selectedEmbroideries.reduce((n, e) => n + e.priceExtra, 0) + (isCustom ? product.customSizeFee : 0)
  const unitPrice = computeUnitPrice({
    basePrice: product.basePrice,
    fabricExtra,
    embroideryExtras: selectedEmbroideries.map((e) => e.priceExtra),
    isCustomSize: isCustom,
    customSizeFee: product.customSizeFee,
  })
  const total = unitPrice * quantity

  // Progression (tissu/couleur/taille) — barre en scaleX (perf)
  const progress =
    ((fabricId ? 1 : 0) + (effectiveColorId ? 1 : 0) + (size ? 1 : 0)) / 3

  // ── Validation ──
  const measureComplete =
    !isCustom || MEASUREMENT_FIELDS.every((f) => {
      const v = measurements[f.key]
      return v !== undefined && v >= f.min && v <= f.max
    })
  const canAdd = !!fabricId && !!effectiveColorId && !!size && measureComplete

  const add = () => {
    if (!canAdd) {
      if (!size) toast.error(t("product.validation.size"))
      else if (!measureComplete) toast.error(t("product.validation.measurements"))
      return
    }
    addItem({
      productId: product.id,
      fabricId,
      colorId: effectiveColorId,
      embroideryIds,
      size,
      measurements: isCustom ? measurements : undefined,
      length: product.hasCustomLength ? length : undefined,
      quantity,
      eventDate: eventDate || undefined,
      note: note || undefined,
      productTitle: product.title,
      productTitleAr: product.titleAr,
      productImage: product.images[0]?.url ?? "",
      unitPrice,
      // Snapshot d'affichage (comme OrderItem côté serveur)
      fabricName: fabricConfig?.name,
      fabricNameAr: fabricConfig?.nameAr,
      colorName: effectiveColor?.name,
      colorNameAr: effectiveColor?.nameAr,
      colorHex: effectiveColor?.hex,
      embroideryNames: selectedEmbroideries.map((e) => e.name),
      embroideryNamesAr: selectedEmbroideries.map((e) => e.nameAr),
    })
    setFlyKey((k) => k + 1)
    setAdded(true)
    toast.success(t("product.actions.added"))
    setTimeout(() => setAdded(false), 2200)
  }

  // ── Commande WhatsApp directe ──
  const whatsappOrder = () => {
    if (!canAdd) {
      add()
      return
    }
    const measureStr = isCustom
      ? MEASUREMENT_FIELDS.map((f) => measurements[f.key] ?? "?").join("/")
      : ""
    const config = [
      `${t("product.sections.fabric")}: ${fabricConfig ? L(fabricConfig, "name") : "-"}`,
      `${t("product.sections.color")}: ${effectiveColor ? L(effectiveColor, "name") : "-"}`,
      `${t("product.sections.size")}: ${isCustom ? `${t("product.sizes.custom")} (${measureStr} cm)` : size}`,
      ...(product.hasCustomLength && length
        ? [`${t("product.sections.finish")} — ${t("product.length.title")}: ${length}`]
        : []),
      ...(selectedEmbroideries.length
        ? [`${t("product.sections.embroidery")}: ${selectedEmbroideries.map((e) => L(e, "name")).join(", ")}`]
        : []),
      `${t("common.misc.quantity")}: ${quantity}`,
    ].join("\n")
    const message = t("product.actions.whatsappMessage", {
      product: L(product, "title"),
      price: formatDA(total, lang),
      config,
    })
    window.open(whatsappLink(message), "_blank", "noopener")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de progression */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {t("product.price.estimated")}
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-gold/70 to-gold"
            style={{ scaleX: progress }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      </div>

      {/* 1 — Tissu */}
      <Section step={1} title={t("product.fabrics.title")} done={!!fabricId}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {product.fabrics.map((f) => {
            const selected = f.id === fabricId
            return (
              <button
                key={f.id}
                onClick={() => selectFabric(f.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3 text-start transition-all duration-300",
                  selected
                    ? "border-gold bg-gold/10 shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_15%,transparent)]"
                    : "border-border hover:border-gold/40"
                )}
              >
                {f.image ? (
                  <SmartImage
                    src={f.image}
                    alt={L(f, "name")}
                    className="h-12 w-12 shrink-0 rounded-lg"
                    sizes="48px"
                    quality={55}
                  />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{L(f, "name")}</span>
                  <span className={cn("mt-0.5 block text-xs", f.productExtra > 0 ? "text-gold" : "text-muted-foreground")}>
                    {f.productExtra > 0
                      ? t("product.fabrics.supplement", { amount: formatDA(f.productExtra, lang) })
                      : t("product.fabrics.included")}
                  </span>
                </span>
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* 2 — Couleur */}
      <Section step={2} title={t("product.colors.title")} done={!!effectiveColorId}>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t("product.colors.title")}>
          {availableColors.map((c) => {
            const selected = c.id === effectiveColorId
            return (
              <button
                key={c.id}
                onClick={() => {
                  setColorId(c.id)
                  onColorHexChange?.(c.hex)
                }}
                role="radio"
                aria-checked={selected}
                title={L(c, "name")}
                className="group flex flex-col items-center gap-1.5"
              >
                <span className="relative">
                  <motion.span
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "block h-11 w-11 rounded-full border-2 transition-shadow",
                      selected
                        ? "border-gold shadow-[0_0_0_4px_color-mix(in_oklab,var(--gold)_22%,transparent)]"
                        : "border-border group-hover:border-gold/50"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check
                        className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                        style={{ color: "#fff" }}
                        strokeWidth={3}
                      />
                    </motion.span>
                  )}
                </span>
                <span className={cn("max-w-16 truncate text-[11px]", selected ? "font-semibold text-gold" : "text-muted-foreground")}>
                  {L(c, "name")}
                </span>
              </button>
            )
          })}
          {availableColors.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("product.colors.unavailable")}</p>
          )}
        </div>
      </Section>

      {/* 3 — Taille */}
      <Section step={3} title={t("product.sizes.title")} done={!!size}>
        <div className="flex flex-wrap items-center gap-2.5">
          {STANDARD_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={cn(
                "flex h-11 min-w-14 items-center justify-center rounded-xl border px-4 font-display text-sm font-semibold transition-all",
                size === s
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-border text-foreground/80 hover:border-gold/40"
              )}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setSize("sur-mesure")}
            aria-pressed={isCustom}
            className={cn(
              "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all",
              isCustom
                ? "border-gold bg-gold text-primary-foreground shadow-[0_6px_20px_-6px_color-mix(in_oklab,var(--gold)_70%,transparent)]"
                : "border-gold/50 text-gold hover:bg-gold/10"
            )}
          >
            <Ruler className="h-4 w-4" />
            {t("product.sizes.custom")}
          </button>
        </div>
        <button
          onClick={() => navigate("/size-guide")}
          className="mt-3 text-xs font-medium text-gold underline-offset-4 hover:underline"
        >
          {t("product.sizes.seeGuide")}
        </button>

        {/* Champs de mesures (sur-mesure) - avec lien vers wizard */}
        <AnimatePresence initial={false}>
          {isCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t("product.measurements.help")}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-gold">
                      {t("product.sizes.customFee", { amount: formatDA(product.customSizeFee, lang) })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Ouvrir le MeasurementWizard
                      toast.info(t("product.measurements.wizardSoon"));
                    }}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-gold/15 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/25 transition-colors"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    {t("product.measurements.useWizard")}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {MEASUREMENT_FIELDS.map((f) => {
                    const value = measurements[f.key]
                    const valid = value !== undefined && value >= f.min && value <= f.max
                    return (
                      <div key={f.key}>
                        <label
                          htmlFor={`m-${f.key}`}
                          className={cn(
                            "mb-1 block text-[11px] font-medium",
                            value !== undefined && !valid ? "text-red-400" : "text-muted-foreground"
                          )}
                        >
                          {lang === "ar" ? f.ar : f.fr} (cm)
                        </label>
                        <input
                          id={`m-${f.key}`}
                          type="number"
                          inputMode="numeric"
                          min={f.min}
                          max={f.max}
                          value={value ?? ""}
                          onChange={(e) =>
                            setMeasurements((m) => {
                              const next = { ...m }
                              const v = e.target.value
                              if (v === "") delete next[f.key]
                              else next[f.key] = Number(v)
                              return next
                            })
                          }
                          placeholder={`${f.min}–${f.max}`}
                          className={cn(
                            "h-11 w-full rounded-lg border bg-card px-3 text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            value !== undefined && !valid ? "border-red-400/60" : "border-border focus:border-gold/60"
                          )}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* 4 — Broderie */}
      {product.embroideries.length > 0 && (
        <Section step={4} title={`${t("product.embroideries.title")} · ${t("product.embroideries.optional")}`}>
          <div className="flex flex-col gap-2.5">
            {product.embroideries.map((e) => {
              const checked = embroideryIds.includes(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() =>
                    setEmbroideryIds((ids) =>
                      ids.includes(e.id) ? ids.filter((i) => i !== e.id) : [...ids, e.id]
                    )
                  }
                  role="checkbox"
                  aria-checked={checked}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-start transition-all duration-300",
                    checked ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      checked ? "border-gold bg-gold text-primary-foreground" : "border-border"
                    )}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex-1 text-sm font-medium">{L(e, "name")}</span>
                  {e.priceExtra > 0 && (
                    <span className="text-xs font-semibold text-gold">
                      +{formatDA(e.priceExtra, lang)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* 5 — Finitions */}
      <Section step={product.embroideries.length > 0 ? 5 : 4} title={t("product.sections.finish")}>
        {/* Longueur */}
        {product.hasCustomLength && (
          <div className="mb-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("product.length.title")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {LENGTHS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLength(length === l.value ? "" : l.value)}
                  aria-pressed={length === l.value}
                  className={cn(
                    "h-10 rounded-full border px-5 text-sm transition-all",
                    length === l.value
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-border hover:border-gold/40"
                  )}
                >
                  {lang === "ar" ? l.ar : l.fr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantité */}
        <div className="mb-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("common.misc.quantity")}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="-"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border transition-colors hover:border-gold/50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-display text-lg font-bold tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              aria-label="+"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border transition-colors hover:border-gold/50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Date événement */}
        <div className="mb-4">
          <label htmlFor="event-date" className="mb-2 flex items-center gap-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("product.eventDate")}
            <span className="normal-case text-muted-foreground/70">({t("common.misc.optional")})</span>
          </label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEventDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:border-gold/60 sm:w-56"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t("product.eventDateHint")}</p>
        </div>

        {/* Note libre */}
        <div>
          <label htmlFor="config-note" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("product.note")}
            <span className="normal-case text-muted-foreground/70">({t("common.misc.optional")})</span>
          </label>
          <textarea
            id="config-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t("product.notePlaceholder")}
            className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-gold/60"
          />
        </div>
      </Section>

      {/* ── Récapitulatif prix ── */}
      <div className="glass-strong glow-gold sticky top-20 z-20 rounded-2xl p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("product.price.estimated")}</p>
            <PriceCounter amount={total} lang={lang} className="font-display text-3xl font-bold text-gold" />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t("product.price.breakdown", {
                base: formatDA(product.basePrice, lang),
                extra: formatDA(extras, lang),
              })}
              {quantity > 1 && ` · ×${quantity}`}
            </p>
          </div>
          <p className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {t("product.leadTime", { days: product.leadTimeDays })}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={add}
            className={cn(
              "relative flex h-13 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full py-3.5 font-semibold transition-colors duration-300",
              added
                ? "bg-jade text-white"
                : "bg-gold text-primary-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--gold)_60%,transparent)]"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="ok"
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  {t("product.actions.added")}
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t("product.actions.addToCart")}
                </motion.span>
              )}
            </AnimatePresence>
            {/* Animation vol vers le panier */}
            {flyKey > 0 && <FlyToCart key={flyKey} image={product.images[0]?.url} />}
          </motion.button>
          <button
            onClick={whatsappOrder}
            className="flex h-13 items-center justify-center gap-2 rounded-full border border-[#1faa53]/50 bg-[#1faa53]/10 px-6 py-3.5 font-semibold text-[#35c46b] transition-all hover:bg-[#1faa53]/20"
          >
            <WhatsAppGlyph className="h-5 w-5" />
            {t("product.actions.whatsapp")}
          </button>
        </div>
        <button
          onClick={() => {
            add()
            if (canAdd) navigate("/cart")
          }}
          className="mt-2.5 w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-gold hover:underline"
        >
          {t("common.actions.order")} → {t("checkout.cart.checkout")}
        </button>
      </div>
    </div>
  )
}

// ── Animation « vol » de la vignette vers l'icône panier ─────
function FlyToCart({ image }: { image?: string }) {
  // Simple motion.img en position fixe qui s'envole vers la navbar
  return (
    <motion.img
      src={image || "/images/products/p1.jpg"}
      alt=""
      aria-hidden="true"
      initial={{ opacity: 0.95, scale: 0.5 }}
      animate={{
        opacity: [0.95, 0.9, 0],
        scale: [0.5, 0.3, 0.08],
        x: typeof window !== "undefined" ? [0, window.innerWidth * 0.3] : 0,
        y: typeof window !== "undefined" ? [0, -window.innerHeight * 0.4] : 0,
      }}
      transition={{ duration: 0.65, ease: [0.3, 0.8, 0.4, 1] }}
      className="pointer-events-none fixed z-[80] h-16 w-12 rounded-md object-cover"
      style={{ left: "50%", top: "55%", marginLeft: "-1.5rem", marginTop: "-2rem" }}
    />
  )
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.27-.29.37-.39.1-.1.13-.17.2-.33.07-.16.03-.31-.03-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
    </svg>
  )
}

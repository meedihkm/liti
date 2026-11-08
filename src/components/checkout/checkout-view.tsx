"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Home, Store, Loader2, Banknote, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api, ApiError } from "@/lib/api-client";
import { formatDA } from "@/lib/pricing";
import { useCart, cartSubtotal } from "@/components/cart/cart-store";
import { SmartImage } from "@/components/layout/smart-image";
import { WILAYAS } from "@/lib/constants";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Checkout — coordonnées + livraison (wilaya → frais réels),
// paiement à la livraison (V1), honeypot anti-spam. Le serveur
// RECALCULE les prix : rien de critique n'est lu depuis le client.
// ─────────────────────────────────────────────────────────────

interface FormState {
  fullName: string
  phone: string
  email: string
  wilayaCode: string
  commune: string
  address: string
  deliveryMode: "home" | "pickup"
  note: string
  website: string // honeypot — doit rester vide
}

const EMPTY: FormState = {
  fullName: "",
  phone: "",
  email: "",
  wilayaCode: "",
  commune: "",
  address: "",
  deliveryMode: "home",
  note: "",
  website: "",
}

export function CheckoutView() {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const { shippingRates, settings } = usePublicData()
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const mounted = useMounted()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = cartSubtotal(items)
  const shippingFee = useMemo(() => {
    if (form.deliveryMode === "pickup") return 0
    if (!form.wilayaCode) return null
    return shippingRates[form.wilayaCode] ?? null
  }, [form.deliveryMode, form.wilayaCode, shippingRates])
  const total = subtotal + (shippingFee ?? 0)

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  // Validation client (le serveur revalide tout en Zod)
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (form.fullName.trim().length < 3) e.fullName = t("checkout.errors.required")
    if (!/^(?:\+213|0)(5|6|7)\d{8}$/.test(form.phone.replace(/[\s.\-()]/g, "")))
      e.phone = t("checkout.errors.phone")
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("checkout.errors.email")
    if (!form.wilayaCode) e.wilayaCode = t("checkout.errors.required")
    if (form.commune.trim().length < 2) e.commune = t("checkout.errors.required")
    if (form.deliveryMode === "home" && form.address.trim().length < 5)
      e.address = t("checkout.errors.address")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (items.length === 0) {
      toast.error(t("checkout.errors.emptyCart"))
      navigate("/catalog")
      return
    }
    if (form.website) return // honeypot rempli → robot
    if (!validate()) {
      toast.error(t("checkout.errors.required"))
      return
    }
    setSubmitting(true)
    try {
      // On n'envoie AUCUN prix : le serveur recalcule tout depuis la base
      const payload = {
        items: items.map((it: CartLine) => ({
          productId: it.productId,
          fabricId: it.fabricId,
          colorId: it.colorId,
          embroideryIds: it.embroideryIds,
          size: it.size,
          measurements: it.measurements,
          length: it.length,
          quantity: it.quantity,
          eventDate: it.eventDate,
          note: it.note,
        })),
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          wilayaCode: Number(form.wilayaCode),
          commune: form.commune.trim(),
          address: form.address.trim(),
          deliveryMode: form.deliveryMode,
          note: form.note.trim(),
        },
        website: "",
      }
      const res = await api<{ number: string; total: number }>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      // Mémorise pour la page de confirmation (le suivi exigera n° + tél)
      sessionStorage.setItem("rk-last-order", JSON.stringify({ number: res.number, phone: form.phone }))
      clear()
      navigate(`/confirmation/${res.number}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) toast.error(t("checkout.errors.rate"))
      else if (err instanceof ApiError) toast.error(err.message || t("checkout.errors.server"))
      else toast.error(t("checkout.errors.server"))
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold">{t("checkout.errors.emptyCart")}</h1>
        <button
          onClick={() => navigate("/catalog")}
          className="mt-6 rounded-full bg-gold px-6 py-3 font-semibold text-primary-foreground"
        >
          {t("checkout.cart.emptyCta")}
        </button>
      </section>
    )
  }

  const inputCls = (key: string) =>
    cn(
      "h-12 w-full rounded-xl border bg-card px-4 text-sm transition-colors focus:border-gold/60",
      errors[key] ? "border-red-400/70" : "border-border"
    )
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
  const ErrorMsg = ({ k }: { k: string }) =>
    errors[k] ? (
      <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="h-3 w-3" /> {errors[k]}
      </p>
    ) : null

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">{t("checkout.form.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.form.subtitle")}</p>
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Formulaire ── */}
        <div className="flex flex-col gap-5">
          {/* Coordonnées */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-display text-lg font-semibold">{t("checkout.form.contact")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className={labelCls}>
                  {t("checkout.form.fullName")} *
                </label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder={t("checkout.form.fullNamePh")}
                  autoComplete="name"
                  className={inputCls("fullName")}
                />
                <ErrorMsg k="fullName" />
              </div>
              <div>
                <label htmlFor="phone" className={labelCls}>
                  {t("checkout.form.phone")} *
                </label>
                <input
                  id="phone"
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder={t("checkout.form.phonePh")}
                  autoComplete="tel"
                  className={inputCls("phone")}
                />
                <ErrorMsg k="phone" />
              </div>
              <div>
                <label htmlFor="email" className={labelCls}>
                  {t("checkout.form.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder={t("checkout.form.emailPh")}
                  autoComplete="email"
                  className={inputCls("email")}
                />
                <ErrorMsg k="email" />
              </div>
            </div>
          </motion.div>

          {/* Livraison */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 sm:p-6"
          >
            <h2 className="font-display text-lg font-semibold">{t("checkout.form.delivery")}</h2>

            {/* Mode de réception */}
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={t("checkout.form.delivery")}>
              <button
                role="radio"
                aria-checked={form.deliveryMode === "home"}
                onClick={() => set("deliveryMode", "home")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-start transition-all",
                  form.deliveryMode === "home" ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                )}
              >
                <Home className={cn("h-5 w-5", form.deliveryMode === "home" ? "text-gold" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold">{t("checkout.form.home")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {shippingFee !== null && form.deliveryMode === "home"
                      ? formatDA(shippingFee, lang)
                      : t("checkout.cart.shippingCalculated")}
                  </span>
                </span>
              </button>
              <button
                role="radio"
                aria-checked={form.deliveryMode === "pickup"}
                onClick={() => set("deliveryMode", "pickup")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-start transition-all",
                  form.deliveryMode === "pickup" ? "border-jade bg-jade/10" : "border-border hover:border-jade/40"
                )}
              >
                <Store className={cn("h-5 w-5", form.deliveryMode === "pickup" ? "text-jade" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold">{t("checkout.form.pickup")}</span>
                  <span className="mt-0.5 block text-xs text-jade">{t("checkout.form.pickupFree")}</span>
                </span>
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wilaya" className={labelCls}>
                  {t("checkout.form.wilaya")} *
                </label>
                <select
                  id="wilaya"
                  value={form.wilayaCode}
                  onChange={(e) => set("wilayaCode", e.target.value)}
                  className={cn(inputCls("wilayaCode"), "appearance-none")}
                >
                  <option value="">{t("checkout.form.wilayaPh")}</option>
                  {WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {String(w.code).padStart(2, "0")} — {lang === "ar" ? w.nameAr : w.name}
                    </option>
                  ))}
                </select>
                <ErrorMsg k="wilayaCode" />
              </div>
              <div>
                <label htmlFor="commune" className={labelCls}>
                  {t("checkout.form.commune")} *
                </label>
                <input
                  id="commune"
                  value={form.commune}
                  onChange={(e) => set("commune", e.target.value)}
                  placeholder={t("checkout.form.communePh")}
                  className={inputCls("commune")}
                />
                <ErrorMsg k="commune" />
              </div>
              {form.deliveryMode === "home" && (
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelCls}>
                    {t("checkout.form.address")} *
                  </label>
                  <input
                    id="address"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder={t("checkout.form.addressPh")}
                    autoComplete="street-address"
                    className={inputCls("address")}
                  />
                  <ErrorMsg k="address" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label htmlFor="note" className={labelCls}>
                  {t("checkout.form.note")}
                </label>
                <textarea
                  id="note"
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={t("checkout.form.notePh")}
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-gold/60"
                />
              </div>
            </div>

            {/* Honeypot anti-spam (invisible) */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>
          </motion.div>

          {/* Paiement */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl border-gold/25 p-5"
          >
            <div className="flex items-start gap-3">
              <Banknote className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
              <div>
                <h3 className="font-display text-base font-semibold">{t("checkout.form.payment")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("checkout.form.paymentHint")}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Récapitulatif ── */}
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:sticky lg:top-20 lg:self-start"
        >
          <div className="glass-strong glow-gold rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold">{t("checkout.form.summary")}</h2>
            <ul className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto pe-1 scroll-slim">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg">
                    <SmartImage src={it.productImage || "/images/products/p1.jpg"} alt={lang === "ar" ? it.productTitleAr : it.productTitle} className="h-full w-full" sizes="48px" quality={50} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lang === "ar" ? it.productTitleAr : it.productTitle}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {it.size === "sur-mesure" ? t("checkout.cart.custom") : it.size} · ×{it.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold tabular-nums">
                    {formatDA(it.unitPrice * it.quantity, lang)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="my-4 h-px bg-border" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.misc.subtotal")}</span>
                <span className="tabular-nums">{formatDA(subtotal, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.form.shippingFee")}</span>
                <span className="tabular-nums">
                  {form.deliveryMode === "pickup"
                    ? t("common.misc.free")
                    : shippingFee !== null
                      ? formatDA(shippingFee, lang)
                      : "—"}
                </span>
              </div>
              <div className="flex items-end justify-between pt-2">
                <span className="font-medium">{t("checkout.form.orderTotal")}</span>
                <span className="font-display text-2xl font-bold text-gold tabular-nums">
                  {formatDA(total, lang)}
                </span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--gold)_60%,transparent)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("checkout.form.submitting")}
                </>
              ) : (
                t("checkout.form.submit")
              )}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" />
              {t("checkout.form.agree")}
            </p>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {L(settings, "address")}
            </p>
          </div>
        </motion.aside>
      </div>
    </section>
  )
}

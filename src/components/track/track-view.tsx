"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageSearch, Search, Loader2, AlertCircle, CheckCircle2, Clock, XCircle, MessageCircle } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { formatDA } from "@/lib/pricing";
import { STATUS_LABELS, STATUS_TONE, MEASUREMENT_FIELDS } from "@/lib/constants";
import { SmartImage } from "@/components/layout/smart-image";
import { BerberDivider } from "@/components/layout/berber-divider";
import type { OrderDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Suivi de commande — numéro + téléphone → statut, historique,
// articles et totaux. L'adresse exacte n'est jamais divulguée
// (seulement wilaya + commune), le téléphone reste privé.
// ─────────────────────────────────────────────────────────────

const TIMELINE = ["pending", "validated", "crafting", "ready", "shipped", "delivered"] as const

export function TrackView() {
  const { t, lang } = useI18n()
  const { query } = useRouter()
  const { whatsappLink } = usePublicData()
  const [number, setNumber] = useState(query.get("number") ?? "")
  const [phone, setPhone] = useState("")
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!number.trim() || !phone.trim()) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    try {
      const res = await api<OrderDTO>(
        `/api/track?number=${encodeURIComponent(number.trim())}&phone=${encodeURIComponent(phone.trim())}`
      )
      setOrder(res)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (query.get("number")) setNumber(query.get("number") ?? "")
  }, [query])

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="glass mx-auto flex h-16 w-16 items-center justify-center rounded-full text-gold">
          <PackageSearch className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold">{t("checkout.track.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.track.subtitle")}</p>
      </motion.div>

      {/* Formulaire de recherche */}
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={submit}
        className="glass-strong glow-gold mx-auto mt-8 max-w-xl rounded-2xl p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="track-number" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("checkout.track.numberLabel")}
            </label>
            <input
              id="track-number"
              dir="ltr"
              value={number}
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
              placeholder={t("checkout.track.numberPh")}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 font-display text-sm uppercase tracking-wide focus:border-gold/60"
            />
          </div>
          <div>
            <label htmlFor="track-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("checkout.track.phoneLabel")}
            </label>
            <input
              id="track-phone"
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("checkout.track.phonePh")}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm focus:border-gold/60"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !number.trim() || !phone.trim()}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          {t("checkout.track.submit")}
        </button>
        {notFound && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {t("checkout.track.notFound")}
          </p>
        )}
      </motion.form>

      {/* Résultat */}
      <AnimatePresence mode="wait">
        {order && (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="mt-8"
          >
            {/* Statut actuel */}
            <div className="glass-strong glow-gold rounded-2xl p-5 text-center sm:p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("checkout.track.statusTitle")}
              </p>
              <p className="mt-2 font-display text-2xl font-bold" dir="ltr">
                {order.number}
              </p>
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
                  STATUS_TONE[order.status]
                )}
              >
                {STATUS_LABELS[order.status]?.[lang]}
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("checkout.track.orderDate")} :{" "}
                {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {order.refusalReason && (
                <p className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
                  <strong>{t("checkout.track.refusedReason")} :</strong> {order.refusalReason}
                </p>
              )}
            </div>

            {/* Timeline */}
            {order.status !== "refused" && order.status !== "cancelled" && (
              <div className="glass mt-4 rounded-2xl p-5 sm:p-6">
                <h2 className="font-display text-base font-semibold">{t("checkout.track.timeline")}</h2>
                <ol className="mt-5 space-y-0">
                  {TIMELINE.map((status, i) => {
                    const event = order.history.find((h) => h.status === status)
                    const reached = TIMELINE.indexOf(order.status as (typeof TIMELINE)[number]) >= i
                    const isCurrent = order.status === status
                    return (
                      <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Ligne verticale */}
                        {i < TIMELINE.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute start-[15px] top-8 h-[calc(100%-32px)] w-0.5",
                              reached ? "bg-gold/50" : "bg-border"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            reached
                              ? "border-gold bg-gold/20 text-gold"
                              : "border-border bg-card text-muted-foreground"
                          )}
                        >
                          {reached ? (
                            isCurrent ? (
                              <Clock className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />
                          )}
                        </span>
                        <div className="pt-1">
                          <p className={cn("text-sm font-semibold", isCurrent && "text-gold")}>
                            {STATUS_LABELS[status]?.[lang]}
                          </p>
                          {event && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-DZ" : "fr-FR",
                                { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                              )}
                              {event.note && ` — ${event.note}`}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}

            {/* Articles + totaux */}
            <div className="glass mt-4 rounded-2xl p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold">{t("checkout.track.items")}</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {order.items.map((item) => {
                  const embroideries: { name: string; nameAr: string }[] = JSON.parse(item.embroideryJson || "[]")
                  const measurements: Record<string, number> = JSON.parse(item.measurementsJson || "{}")
                  return (
                    <li key={item.id} className="flex gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg">
                        <SmartImage src={item.productImage || "/images/products/p1.jpg"} alt={item.productName} className="h-full w-full" sizes="64px" quality={50} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {[item.fabricName, item.colorName, item.size === "sur-mesure" ? t("checkout.cart.custom") : item.size, item.length]
                            .filter(Boolean)
                            .join(" · ")}
                          {embroideries.length > 0 &&
                            ` · ${embroideries.map((e) => (lang === "ar" ? e.nameAr : e.name)).join(", ")}`}
                        </p>
                        {item.size === "sur-mesure" && Object.keys(measurements).length > 0 && (
                          <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                            {MEASUREMENT_FIELDS.filter((f) => measurements[f.key] !== undefined)
                              .map((f) => `${measurements[f.key]}`)
                              .join(" / ")}{" "}
                            cm
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold">
                          {formatDA(item.unitPrice, lang)} × {item.quantity}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 space-y-1 border-t border-border/60 pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("checkout.track.delivery")}</span>
                  <span>
                    {order.wilayaName} · {order.deliveryMode === "pickup" ? t("checkout.form.pickup") : t("checkout.form.home")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("common.misc.shipping")}</span>
                  <span>{order.shippingFee === 0 ? t("common.misc.free") : formatDA(order.shippingFee, lang)}</span>
                </div>
                <div className="flex items-end justify-between pt-1">
                  <span className="font-medium">{t("checkout.track.total")}</span>
                  <span className="font-display text-xl font-bold text-gold tabular-nums">
                    {formatDA(order.total, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6 text-center">
              <BerberDivider variant="line" className="mx-auto max-w-xs opacity-40" />
              <p className="mt-4 text-sm text-muted-foreground">{t("checkout.track.contact")}</p>
              <a
                href={whatsappLink(
                  lang === "ar"
                    ? `مرحبًا، سؤال حول طلبي ${order.number}.`
                    : `Bonjour, j'ai une question sur ma commande ${order.number}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-12 items-center gap-2 rounded-full border border-[#1faa53]/50 bg-[#1faa53]/10 px-7 font-semibold text-[#35c46b] transition-all hover:bg-[#1faa53]/20"
              >
                <MessageCircle className="h-5 w-5" />
                {t("checkout.track.contactCta")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

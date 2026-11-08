"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, PackageSearch, PhoneCall, Scissors, Truck, Banknote, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { formatDA } from "@/lib/pricing";
import { STATUS_LABELS, STATUS_TONE, MEASUREMENT_FIELDS } from "@/lib/constants";
import { SmartImage } from "@/components/layout/smart-image";
import { YazMark } from "@/components/layout/berber-divider";
import type { OrderDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Confirmation — numéro de commande + récapitulatif + prochaines
// étapes. Récupère la commande via le téléphone mémorisé en
// session (le suivi public exige n° + téléphone).
// ─────────────────────────────────────────────────────────────

export function ConfirmationView({ number }: { number: string }) {
  const { t, lang } = useI18n()
  const { navigate } = useRouter()
  const { whatsappLink } = usePublicData()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let phone = ""
    try {
      const stored = sessionStorage.getItem("rk-last-order")
      if (stored) phone = JSON.parse(stored).phone ?? ""
    } catch {}
    if (phone) {
      api<OrderDTO>(`/api/track?number=${encodeURIComponent(number)}&phone=${encodeURIComponent(phone)}`)
        .then(setOrder)
        .catch(() => {})
    }
  }, [number])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(true)
      toast.success(t("common.actions.copied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const steps = [
    { icon: PhoneCall, text: t("checkout.confirmation.n1") },
    { icon: Scissors, text: t("checkout.confirmation.n2", { days: "14–30" }) },
    { icon: Truck, text: t("checkout.confirmation.n3") },
    { icon: Banknote, text: t("checkout.confirmation.n4") },
  ]

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* En-tête succès */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
          className="glow-gold mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold"
        >
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </motion.span>
        <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
          {t("checkout.confirmation.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.confirmation.subtitle", { name: order?.fullName ?? "" })}</p>

        {/* Numéro de commande */}
        <div className="glass-strong glow-gold mx-auto mt-7 flex max-w-md items-center justify-between gap-3 rounded-2xl px-5 py-4">
          <div className="text-start">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("checkout.confirmation.numberLabel")}
            </p>
            <p className="font-display text-xl font-bold text-gold" dir="ltr">
              {number}
            </p>
          </div>
          <button
            onClick={copy}
            aria-label={t("common.actions.copy")}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
              copied ? "border-jade bg-jade/15 text-jade" : "border-border hover:border-gold/50 hover:text-gold"
            )}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("checkout.confirmation.copyHint")}</p>
      </motion.div>

      {/* Commande récupérée ? → récapitulatif détaillé */}
      {order ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="glass mt-10 rounded-2xl p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{t("checkout.confirmation.details")}</h2>
            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", STATUS_TONE[order.status])}>
              {STATUS_LABELS[order.status]?.[lang]}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-4">
            {order.items.map((item) => {
              const embroideries: { name: string; nameAr: string }[] = JSON.parse(item.embroideryJson || "[]")
              const measurements: Record<string, number> = JSON.parse(item.measurementsJson || "{}")
              return (
                <li key={item.id} className="flex gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                  <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl">
                    <SmartImage src={item.productImage || "/images/products/p1.jpg"} alt={item.productName} className="h-full w-full" sizes="80px" quality={55} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {item.fabricName && <span className="rounded-full border border-border px-2 py-0.5">{item.fabricName}</span>}
                      {item.colorName && (
                        <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.colorHex }} />
                          {item.colorName}
                        </span>
                      )}
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {item.size === "sur-mesure" ? t("checkout.cart.custom") : item.size}
                      </span>
                      {item.length && <span className="rounded-full border border-border px-2 py-0.5">{item.length}</span>}
                      {embroideries.map((e) => (
                        <span key={e.name} className="rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 text-gold">
                          {lang === "ar" ? e.nameAr : e.name}
                        </span>
                      ))}
                    </div>
                    {item.size === "sur-mesure" && Object.keys(measurements).length > 0 && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                        {t("checkout.cart.measurements")}:{" "}
                        {MEASUREMENT_FIELDS.filter((f) => measurements[f.key] !== undefined)
                          .map((f) => `${measurements[f.key]}`)
                          .join(" / ")}{" "}
                        cm
                      </p>
                    )}
                    {item.note && <p className="mt-1 text-[11px] italic text-muted-foreground">“{item.note}”</p>}
                    <p className="mt-1.5 text-sm font-semibold">
                      {formatDA(item.unitPrice, lang)} × {item.quantity}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border/60 pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("common.misc.subtotal")}</span>
              <span className="tabular-nums">{formatDA(order.subtotal, lang)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>
                {t("common.misc.shipping")} ·{" "}
                {order.deliveryMode === "pickup" ? t("checkout.form.pickup") : t("checkout.form.home")}
              </span>
              <span className="tabular-nums">
                {order.shippingFee === 0 ? t("common.misc.free") : formatDA(order.shippingFee, lang)}
              </span>
            </div>
            <div className="flex items-end justify-between pt-1">
              <span className="font-medium">{t("checkout.form.orderTotal")}</span>
              <span className="font-display text-xl font-bold text-gold tabular-nums">
                {formatDA(order.total, lang)}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass mt-10 flex items-center gap-3 rounded-2xl p-4 text-sm text-muted-foreground"
        >
          <PackageSearch className="h-5 w-5 shrink-0 text-gold" />
          {t("checkout.confirmation.callSoon")}
        </motion.div>
      )}

      {/* Prochaines étapes */}
      <motion.ol
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="glass mt-6 rounded-2xl p-5 sm:p-6"
      >
        <h2 className="font-display text-lg font-semibold">{t("checkout.confirmation.whatNext")}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">
                <s.icon className="h-4 w-4" />
              </span>
              <p className="pt-1.5 text-sm leading-snug">{s.text}</p>
            </li>
          ))}
        </ol>
      </motion.ol>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <button
          onClick={() => navigate(`/track?number=${number}`)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-7 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto"
        >
          <PackageSearch className="h-5 w-5" />
          {t("checkout.confirmation.trackCta")}
        </button>
        <a
          href={whatsappLink(
            lang === "ar"
              ? `مرحبًا، طلبي للتو برقم ${number}. أريد التأكد من استلامه.`
              : `Bonjour, je viens de passer la commande ${number}. Je souhaite confirmer sa bonne réception.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="glass flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 font-semibold transition-all hover:border-jade/50 hover:text-jade sm:w-auto"
        >
          {t("checkout.confirmation.whatsappCta")}
        </a>
        <button
          onClick={() => navigate("/")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-sm font-medium text-muted-foreground hover:text-gold sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("checkout.confirmation.backHome")}
        </button>
      </motion.div>

      <div className="mt-12 text-center">
        <span className="inline-block text-gold/40">
          <YazMark className="h-10 w-10" />
        </span>
        <p className="mt-2 text-xs text-muted-foreground">
          Tanemmirt — {lang === "ar" ? "شكرًا لثقتكم" : "Merci de votre confiance"}
        </p>
      </div>
    </section>
  )
}

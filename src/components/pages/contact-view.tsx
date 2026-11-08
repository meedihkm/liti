"use client";

// ─────────────────────────────────────────────────────────────
// ContactView — « Contact » : formulaire (honeypot + validation
// client + POST /api/contact) et coordonnées (tél, WhatsApp,
// carte stylisée, réseaux) + mini FAQ. Contenus via pages[lang].
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Facebook,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  Music2,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { pages } from "@/i18n/dict/pages";
import { BerberDivider } from "@/components/layout/berber-divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Révélation au scroll : opacity/translateY uniquement.
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Glyphe WhatsApp officiel (même tracé que le bouton flottant / footer)
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.27-.29.37-.39.1-.1.13-.17.2-.33.07-.16.03-.31-.03-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
    </svg>
  );
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  website: string; // honeypot — doit rester vide
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

const PHONE_RE = /^(?:\+213|0)(5|6|7)\d{8}$/;

export function ContactView() {
  const { lang, t } = useI18n();
  const { navigate } = useRouter();
  const { settings, whatsappLink } = usePublicData();
  const d = pages[lang].contact;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);

  const telHref = useMemo(
    () => `tel:${settings.phone.replace(/[^\d+]/g, "")}`,
    [settings.phone]
  );
  const mailHref = useMemo(() => `mailto:${settings.email}`, [settings.email]);

  const socials = useMemo(
    () =>
      [
        { href: settings.instagram, label: "Instagram", icon: Instagram },
        { href: settings.facebook, label: "Facebook", icon: Facebook },
        { href: settings.tiktok, label: "TikTok", icon: Music2 },
      ].filter((s) => Boolean(s.href)),
    [settings.instagram, settings.facebook, settings.tiktok]
  );

  function setField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = d.form.errName;
    if (
      form.phone.trim() &&
      !PHONE_RE.test(form.phone.replace(/[\s.\-()]/g, ""))
    ) {
      errs.phone = d.form.errPhone;
    }
    if (form.message.trim().length < 10) errs.message = d.form.errMessage;
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      return;
    }
    setSending(true);
    try {
      await api("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          website: form.website,
        }),
      });
      toast.success(d.form.success);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      // Le serveur renvoie { error: message } (422 validation / 429 rate-limit)
      const message = err instanceof Error ? err.message : t("common.misc.error");
      setServerError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  const f = d.form;
  const infos = d.infos;

  return (
    <div className="pb-4">
      {/* ── Hero de section ─────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="berber-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="absolute -top-32 start-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl rtl:translate-x-1/2"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-14 text-center sm:px-6 sm:pt-18">
          <Reveal>
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {d.hero.badge}
            </p>
            <h1 className="font-display mt-6 text-4xl font-bold leading-tight sm:text-5xl">
              {d.hero.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance leading-relaxed text-muted-foreground">
              {d.hero.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Formulaire + coordonnées ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          {/* — Formulaire — */}
          <Reveal>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8"
            >
              <div
                className="berber-lines absolute inset-x-0 top-0 h-3.5 opacity-70"
                aria-hidden="true"
              />
              <h2 className="font-display text-2xl font-bold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.subtitle}</p>

              <div className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">{f.name}</Label>
                    <Input
                      id="contact-name"
                      name="name"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder={f.namePlaceholder}
                      maxLength={80}
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">{f.phone}</Label>
                    <Input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder={f.phonePlaceholder}
                      maxLength={20}
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">{f.email}</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder={f.emailPlaceholder}
                    maxLength={120}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-subject">{f.subject}</Label>
                  <Input
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={(e) => setField("subject", e.target.value)}
                    placeholder={f.subjectPlaceholder}
                    maxLength={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">{f.message}</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={(e) => setField("message", e.target.value)}
                    placeholder={f.messagePlaceholder}
                    rows={6}
                    maxLength={2000}
                    aria-invalid={Boolean(errors.message)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {errors.message ? (
                      <p className="text-destructive" role="alert">
                        {errors.message}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{f.messageHint}</p>
                    )}
                    <p
                      className={
                        form.message.length >= 10
                          ? "text-gold/80"
                          : "text-muted-foreground/70"
                      }
                      aria-hidden="true"
                    >
                      {t("pages.contact.form.counter", {
                        n: form.message.length,
                        max: 2000,
                      })}
                    </p>
                  </div>
                </div>

                {/* Honeypot anti-spam — invisible, hors tabulation */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                >
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setField("website", e.target.value)}
                  />
                </div>

                {serverError && (
                  <p
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {serverError}
                  </p>
                )}

                <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {f.sending}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                        {f.send}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {f.disclaimer}{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/legal/privacy")}
                      className="text-gold underline underline-offset-2 transition-colors hover:text-gold/80"
                    >
                      {f.privacyLink}
                    </button>
                    .
                  </p>
                </div>
              </div>
            </form>
          </Reveal>

          {/* — Coordonnées — */}
          <Reveal delay={0.08} className="self-start lg:sticky lg:top-24">
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 sm:p-7">
                <h2 className="font-display text-2xl font-bold">{infos.title}</h2>
                <BerberDivider variant="line" className="mt-4" />

                <ul className="mt-5 space-y-4 text-sm">
                  {settings.phone && (
                    <li>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {infos.phoneLabel}
                      </p>
                      <a
                        href={telHref}
                        dir="ltr"
                        className="mt-1 inline-flex items-center gap-2.5 font-medium transition-colors hover:text-gold"
                      >
                        <Phone className="h-4 w-4 text-gold/70" aria-hidden="true" />
                        {settings.phone}
                      </a>
                    </li>
                  )}
                  {settings.email && (
                    <li>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {infos.emailLabel}
                      </p>
                      <a
                        href={mailHref}
                        dir="ltr"
                        className="mt-1 inline-flex items-center gap-2.5 font-medium transition-colors hover:text-gold"
                      >
                        <Mail className="h-4 w-4 text-gold/70" aria-hidden="true" />
                        {settings.email}
                      </a>
                    </li>
                  )}
                  <li>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {infos.addressLabel}
                    </p>
                    <p className="mt-1 flex items-start gap-2.5 font-medium">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-gold/70"
                        aria-hidden="true"
                      />
                      {lang === "ar" ? settings.addressAr : settings.address}
                    </p>
                  </li>
                  <li>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {infos.hoursLabel}
                    </p>
                    <dl className="mt-1.5 space-y-1.5">
                      {infos.hoursLines.map((h) => (
                        <div key={h.days} className="flex items-start gap-2.5">
                          <Clock
                            className="mt-0.5 h-4 w-4 shrink-0 text-gold/70"
                            aria-hidden="true"
                          />
                          <div className="flex flex-wrap gap-x-2">
                            <dt className="font-medium">{h.days}</dt>
                            <dd dir="ltr" className="text-muted-foreground">
                              {h.time}
                            </dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  </li>
                </ul>

                {/* Gros bouton WhatsApp */}
                <a
                  href={whatsappLink(
                    lang === "ar"
                      ? "مرحباً تاقندورث، لدي سؤال."
                      : "Bonjour Taqendurt, j'ai une question."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 flex items-center gap-4 rounded-2xl border border-jade/40 bg-jade/15 p-4 transition-all hover:-translate-y-0.5 hover:bg-jade/25"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-jade text-primary-foreground shadow-lg shadow-jade/20 transition-transform group-hover:scale-105">
                    <WhatsAppGlyph className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-jade">
                      {infos.whatsappLabel}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {infos.whatsappCta}
                    </span>
                  </span>
                </a>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {infos.note}
                </p>

                {/* Réseaux sociaux */}
                {socials.length > 0 && (
                  <div className="mt-6 border-t border-border/60 pt-5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {infos.socialsLabel}
                    </p>
                    <div className="mt-3 flex items-center gap-2.5">
                      {socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
                        >
                          <s.icon className="h-4 w-4" aria-hidden="true" />
                        </a>
                      ))}
                      <a
                        href={whatsappLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-jade/40 bg-jade/10 text-jade transition-all hover:-translate-y-0.5 hover:bg-jade/20"
                      >
                        <WhatsAppGlyph className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* — Carte stylisée — */}
              <div className="glass overflow-hidden rounded-3xl p-6 sm:p-7">
                <h3 className="font-display text-lg font-semibold">
                  {infos.mapTitle}
                </h3>
                <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-border/70">
                  <div
                    className="berber-grid absolute inset-0 opacity-60"
                    aria-hidden="true"
                  />
                  {/* routes stylisées */}
                  <svg
                    viewBox="0 0 400 192"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <g
                      className="text-border"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                    >
                      <path
                        d="M-10 132 C 70 108 150 142 230 104 S 350 118 410 92"
                        strokeWidth="12"
                        opacity="0.5"
                      />
                      <path d="M70 -10 C 96 56 76 120 118 202" strokeWidth="9" opacity="0.4" />
                      <path
                        d="M320 -10 C 300 60 340 130 306 202"
                        strokeWidth="9"
                        opacity="0.4"
                      />
                    </g>
                    <g className="text-gold/60" stroke="currentColor" fill="none">
                      <path
                        d="M344 24 C 268 30 228 56 208 88"
                        strokeWidth="2"
                        strokeDasharray="7 6"
                      />
                    </g>
                  </svg>
                  {/* épingle */}
                  <div
                    className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  >
                    <span className="absolute -inset-3 animate-ping rounded-full bg-gold/25" />
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-background shadow-lg">
                      <MapPin className="h-5 w-5 text-gold" />
                    </span>
                  </div>
                  {/* bandeau adresse + lien */}
                  <div className="glass-strong absolute inset-x-3 bottom-3 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-start gap-2 text-xs leading-snug">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
                        aria-hidden="true"
                      />
                      {lang === "ar" ? settings.addressAr : settings.address}
                    </p>
                    <a
                      href="https://maps.google.com/?q=Tizi+Ouzou"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
                    >
                      {infos.mapCta}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ mini ────────────────────────────────────────── */}
      <section className="border-t border-border/50 bg-card/20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {d.faq.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{d.faq.subtitle}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <Accordion
              type="single"
              collapsible
              className="glass mt-8 rounded-2xl px-5 sm:px-7"
            >
              {d.faq.items.map((item, i) => (
                <AccordionItem key={item.q} value={`faq-${i}`}>
                  <AccordionTrigger className="py-5 text-start text-sm font-semibold sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

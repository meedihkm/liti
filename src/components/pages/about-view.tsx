"use client";

// ─────────────────────────────────────────────────────────────
// AboutView — « À propos » : histoire de l'atelier, savoir-faire,
// valeurs, chiffres clés et CTA. Contenus riches via pages[lang].
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Gem,
  Heart,
  MessageCircle,
  Ruler,
  Scissors,
  Sparkles,
  Users,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { pages } from "@/i18n/dict/pages";
import { SmartImage } from "@/components/layout/smart-image";
import { BerberDivider, YazMark } from "@/components/layout/berber-divider";
import { Button } from "@/components/ui/button";

// Révélation au scroll : opacity/translateY uniquement (MotionConfig
// global « reducedMotion="user" » désactive pour les sensibles).
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

const CRAFT_ICONS = [Scissors, Sparkles, Ruler, BadgeCheck];
const VALUES_ICONS = [Heart, Users, Gem];

export function AboutView() {
  const { lang } = useI18n();
  const { navigate } = useRouter();
  const { whatsappLink } = usePublicData();
  const d = pages[lang].about;

  return (
    <div className="pb-4">
      {/* ── Hero de section ─────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="berber-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="absolute -top-32 start-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl rtl:translate-x-1/2"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pb-20 sm:pt-20">
          <Reveal>
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {d.hero.badge}
            </p>
            <h1 className="font-display mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              {d.hero.titleA}{" "}
              <span className="text-gradient-gold">{d.hero.titleB}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              {d.hero.subtitle}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mx-auto mt-8 max-w-xs">
              <BerberDivider variant="zigzag" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Histoire de l'atelier ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            {/* cadre décalé décoratif */}
            <div
              className="berber-grid absolute -inset-3 rotate-2 rounded-[2rem] border border-gold/20 opacity-60"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 shadow-2xl shadow-black/30">
              <SmartImage
                src="/images/atelier.jpg"
                alt={d.story.imageAlt}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                className="from-background/70 absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent"
                aria-hidden="true"
              />
              <p className="absolute inset-x-0 bottom-0 p-4 text-start text-xs text-foreground/80">
                {d.story.imageCaption}
              </p>
            </div>
            {/* badge flottant */}
            <div className="glass-strong absolute -bottom-6 end-5 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg sm:end-8">
              <span className="text-gold">
                <YazMark className="h-8 w-8" />
              </span>
              <span className="text-start leading-tight">
                <span className="font-display block text-sm font-semibold">
                  {d.story.badgeTitle}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {d.story.badgeText}
                </span>
              </span>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                {d.story.kicker}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                {d.story.title}
              </h2>
            </Reveal>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {d.story.paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.06 * (i + 1)}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Notre savoir-faire ──────────────────────────────── */}
      <section className="border-t border-border/50 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              {d.craft.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{d.craft.subtitle}</p>
            <div className="mx-auto mt-6 max-w-xs">
              <BerberDivider variant="line" />
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {d.craft.items.map((item, i) => {
              const Icon = CRAFT_ICONS[i % CRAFT_ICONS.length];
              return (
                <Reveal key={item.title} delay={0.07 * i}>
                  <article className="glass lift-hover glow-gold-hover h-full rounded-2xl p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display mt-4 text-lg font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Nos valeurs ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {d.values.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{d.values.subtitle}</p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {d.values.items.map((item, i) => {
            const Icon = VALUES_ICONS[i % VALUES_ICONS.length];
            return (
              <Reveal key={item.title} delay={0.07 * i}>
                <article className="glass lift-hover h-full rounded-2xl p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Chiffres clés ───────────────────────────────────── */}
      <section className="border-y border-border/50 bg-card/20">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-border/60 rtl:divide-x-reverse">
            {d.stats.map((stat, i) => (
              <Reveal key={stat.label} delay={0.07 * i} className="px-2 text-center sm:px-6">
                <p className="font-display text-gradient-gold text-3xl font-bold sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-3xl border border-gold/25 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="berber-grid absolute inset-0 opacity-50" aria-hidden="true" />
            <div
              className="absolute -top-24 start-1/4 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 end-1/4 h-64 w-64 rounded-full bg-ember/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <YazMark className="mx-auto h-10 w-10 text-gold/70" />
              <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl">
                {d.cta.title}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
                {d.cta.text}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate("/catalog")}>
                  {d.cta.catalog}
                  <ArrowRight
                    className="h-4 w-4 rtl:-scale-x-100"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-jade/40 bg-jade/10 text-jade hover:bg-jade/20 hover:text-jade"
                  onClick={() =>
                    window.open(
                      whatsappLink(
                        lang === "ar"
                          ? "مرحباً تاقندورث، أريد مناقشة فستان."
                          : "Bonjour Taqendurt, j'aimerais discuter d'une robe."
                      ),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {d.cta.whatsapp}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

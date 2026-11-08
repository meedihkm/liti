"use client";

// ─────────────────────────────────────────────────────────────
// LegalView — pages légales (CGV / Échanges & retours /
// Confidentialité) : titre + date de mise à jour + sections
// numérotées depuis pages[lang].legal[slug], navigation croisée.
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import {
  ChevronRight,
  FileText,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { pages, type LegalPage } from "@/i18n/dict/pages";
import { BerberDivider, YazMark } from "@/components/layout/berber-divider";

const SLUGS = ["cgv", "returns", "privacy"] as const;
type LegalSlug = (typeof SLUGS)[number];

const SLUG_META: Record<LegalSlug, { icon: typeof FileText }> = {
  cgv: { icon: Scale },
  returns: { icon: RotateCcw },
  privacy: { icon: ShieldCheck },
};

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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LegalView({ slug }: { slug: string }) {
  const { lang } = useI18n();
  const { navigate } = useRouter();
  const d = pages[lang].legal;

  const current: LegalSlug = (SLUGS as readonly string[]).includes(slug)
    ? (slug as LegalSlug)
    : "cgv";
  const page: LegalPage = d[current];

  return (
    <div className="pb-4">
      {/* ── Hero de section ─────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="berber-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-18">
          <Reveal>
            <span className="text-gold/70">
              <YazMark className="mx-auto h-10 w-10" />
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-4 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-gold/70" aria-hidden="true" />
              {d.updated}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Sections numérotées ─────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Reveal>
          <BerberDivider variant="line" className="opacity-70" />
        </Reveal>
        <div className="mt-2">
          {page.sections.map((section, i) => {
            const paragraphs = Array.isArray(section.p) ? section.p : [section.p];
            return (
              <Reveal key={section.h} delay={Math.min(i * 0.04, 0.2)}>
                <article className="border-b border-border/40 py-6 last:border-b-0">
                  <h2 className="font-display flex items-baseline gap-3 text-lg font-semibold sm:text-xl">
                    <span className="text-gradient-gold shrink-0 font-bold" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{section.h}</span>
                  </h2>
                  <div className="mt-3 space-y-3 ps-0 sm:ps-9">
                    {paragraphs.map((para, j) => (
                      <p
                        key={j}
                        className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* ── Navigation croisée ───────────────────────────── */}
        <Reveal delay={0.1}>
          <nav
            aria-label={d.alsoSee}
            className="glass mt-10 rounded-2xl p-5 sm:p-6"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {d.alsoSee}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {SLUGS.map((s) => {
                const meta = SLUG_META[s];
                const label = d[s].title;
                const Icon = meta.icon;
                const isCurrent = s === current;
                return (
                  <li key={s}>
                    {isCurrent ? (
                      <span
                        aria-current="page"
                        className="flex h-full items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-medium text-gold"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{label}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/legal/${s}`)}
                        className="flex h-full w-full items-center gap-2.5 rounded-xl border border-border/70 px-4 py-3 text-start text-sm font-medium text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-foreground"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-gold/70" aria-hidden="true" />
                        <span className="flex-1">{label}</span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 rtl:-scale-x-100"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </Reveal>
      </section>
    </div>
  );
}

"use client";

// ─────────────────────────────────────────────────────────────
// SizeGuideView — « Guide des tailles » : standard vs sur-mesure,
// tableau S–XXL, 6 figures de prise de mesures (SVG doré minimal),
// astuces et CTA. Contenus via pages[lang] + MEASUREMENT_FIELDS.
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import {
  ArrowRight,
  Info,
  Lightbulb,
  Ruler,
  Scale,
  Shirt,
  User,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useRouter } from "@/lib/router";
import { pages } from "@/i18n/dict/pages";
import { MEASUREMENT_FIELDS, type MeasurementKey } from "@/lib/constants";
import { BerberDivider, YazMark } from "@/components/layout/berber-divider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// ── Figure de mesure : silhouette féminine stylisée (trait doré
//    discret) + flèche de mesure à l'endroit concerné. ─────────
function MeasureFigure({ field }: { field: MeasurementKey }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className="h-40 w-30 text-gold"
      role="img"
      aria-hidden="true"
    >
      {/* silhouette : tête + buste + robe évasée + bras */}
      <g
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      >
        <circle cx="60" cy="15" r="8" />
        <path d="M60 23 V27" />
        <path d="M60 27 C54 27 46 32 45 39 L48 63 L36 126 C36 131 41 133 60 133 C79 133 84 131 84 126 L72 63 L75 39 C74 32 66 27 60 27 Z" />
        <path d="M45 41 C40 50 36 60 34 71" />
        <path d="M75 41 C80 50 84 60 86 71" />
      </g>
      {/* flèche de mesure (double pointe) */}
      <g
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {field === "chest" && (
          <>
            <path d="M40 46 H80" />
            <path d="M47 42 L40 46 L47 50" />
            <path d="M73 42 L80 46 L73 50" />
          </>
        )}
        {field === "waist" && (
          <>
            <path d="M43 63 H77" />
            <path d="M50 59 L43 63 L50 67" />
            <path d="M70 59 L77 63 L70 67" />
          </>
        )}
        {field === "hips" && (
          <>
            <path d="M41 76 H79" />
            <path d="M48 72 L41 76 L48 80" />
            <path d="M72 72 L79 76 L72 80" />
          </>
        )}
        {field === "length" && (
          <>
            <path d="M14 39 V133" />
            <path d="M10 46 L14 39 L18 46" />
            <path d="M10 126 L14 133 L18 126" />
            <path d="M16 39 H42" strokeDasharray="3 4" opacity="0.6" />
            <path d="M16 133 H36" strokeDasharray="3 4" opacity="0.6" />
          </>
        )}
        {field === "sleeve" && (
          <>
            <path d="M38 45 L27 74" />
            <path d="M38.8 52.8 L38 45 L32.2 50.4" />
            <path d="M32.8 68.6 L27 74 L26.2 66.2" />
          </>
        )}
        {field === "shoulders" && (
          <>
            <path d="M44 35 H76" />
            <path d="M51 31 L44 35 L51 39" />
            <path d="M69 31 L76 35 L69 39" />
          </>
        )}
      </g>
    </svg>
  );
}

const TIP_ICONS = [Ruler, User, Scale];

export function SizeGuideView() {
  const { lang, t } = useI18n();
  const { navigate } = useRouter();
  const d = pages[lang].sizeGuide;

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
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
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

      {/* ── Standard ou sur-mesure ? ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {d.intro.title}
          </h2>
          <div className="mx-auto mt-5 max-w-xs">
            <BerberDivider variant="line" />
          </div>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[d.intro.standard, d.intro.custom].map((item, i) => (
            <Reveal key={item.title} delay={0.07 * i}>
              <article className="glass lift-hover h-full rounded-2xl p-6 sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                  {i === 0 ? (
                    <Shirt className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Ruler className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <h3 className="font-display mt-4 text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Tableau des tailles standards ───────────────────── */}
      <section className="border-t border-border/50 bg-card/20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {d.table.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{d.table.subtitle}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass mt-8 overflow-hidden rounded-2xl">
              <Table className="text-base sm:text-lg">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-center text-xs uppercase tracking-wider sm:text-sm">
                      {d.table.size}
                    </TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider sm:text-sm">
                      {d.table.chest}
                    </TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider sm:text-sm">
                      {d.table.waist}
                    </TableHead>
                    <TableHead className="text-center text-xs uppercase tracking-wider sm:text-sm">
                      {d.table.hips}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.table.rows.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="py-3.5 text-center">
                        <span className="font-display text-lg font-bold text-gold">
                          {row.size}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-center tabular-nums" dir="ltr">
                        {row.chest}
                      </TableCell>
                      <TableCell className="py-3.5 text-center tabular-nums" dir="ltr">
                        {row.waist}
                      </TableCell>
                      <TableCell className="py-3.5 text-center tabular-nums" dir="ltr">
                        {row.hips}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-5 flex items-start justify-center gap-2 text-center text-sm leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" aria-hidden="true" />
              {d.table.note}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Comment se mesurer ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {d.measure.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{d.measure.subtitle}</p>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEASUREMENT_FIELDS.map((f, i) => {
            const card = d.measure.cards[f.key];
            return (
              <Reveal key={f.key} delay={0.06 * i}>
                <article className="glass lift-hover flex h-full flex-col items-center rounded-2xl p-5 text-center sm:p-6">
                  <MeasureFigure field={f.key} />
                  <h3 className="font-display mt-3 text-lg font-semibold">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.text}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-4 border-gold/25 bg-gold/5 text-gold/90 tabular-nums"
                  >
                    {t("pages.sizeGuide.measure.rangeLabel", {
                      min: f.min,
                      max: f.max,
                    })}
                  </Badge>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Astuces de l'atelier ────────────────────────────── */}
      <section className="border-t border-border/50 bg-card/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {d.tips.title}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {d.tips.items.map((item, i) => {
              const Icon = TIP_ICONS[i % TIP_ICONS.length];
              return (
                <Reveal key={item.title} delay={0.07 * i}>
                  <article className="glass-strong h-full rounded-2xl border-gold/20 p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <h3 className="font-display mt-4 flex items-center gap-2 text-lg font-semibold">
                      <Lightbulb
                        className="h-4 w-4 shrink-0 text-gold/60"
                        aria-hidden="true"
                      />
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

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-3xl border border-gold/25 px-6 py-10 text-center sm:py-12">
            <div className="berber-grid absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative">
              <YazMark className="mx-auto h-8 w-8 text-gold/70" />
              <h2 className="font-display mt-3 text-2xl font-bold sm:text-3xl">
                {d.cta.title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-balance text-muted-foreground">
                {d.cta.text}
              </p>
              <Button size="lg" className="mt-6" onClick={() => navigate("/catalog")}>
                {d.cta.button}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

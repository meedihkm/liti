"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowLeft, Sparkles, Phone, Instagram, Facebook, Music2, Star, Scissors, Ruler, PackageCheck, Truck } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";
import { api } from "@/lib/api-client";
import { ProductCard } from "@/components/catalog/product-card";
import { SmartImage } from "@/components/layout/smart-image";
import { BerberDivider, YazMark } from "@/components/layout/berber-divider";
import { ParticlesBackground } from "@/components/layout/particles-background";
import type { CategoryDTO, ProductListDTO } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Accueil — vitrine : hero animé (parallaxe souris + particules),
// bandeau promo, modèles à la une, collections, étapes, témoignages,
// atelier, appel à l'action WhatsApp.
// ─────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string
  title: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto max-w-2xl text-center"
    >
      {kicker && (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">{kicker}</span>
      )}
      <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </motion.div>
  )
}

export function HomeView() {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const { settings, categories, whatsappLink } = usePublicData()
  const [featured, setFeatured] = useState<ProductListDTO | null>(null)

  useEffect(() => {
    api<ProductListDTO>("/api/products?featured=true&limit=4&sort=featured")
      .then(setFeatured)
      .catch(() => {})
  }, [])

  // Parallaxe légère du visuel hero au mouvement de la souris (desktop)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 120, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 120, damping: 18 })

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width)
    my.set((e.clientY - rect.top) / rect.height)
  }

  const steps = [
    { icon: Sparkles, title: t("home.steps.s1.title"), desc: t("home.steps.s1.desc") },
    { icon: Ruler, title: t("home.steps.s2.title"), desc: t("home.steps.s2.desc") },
    { icon: Phone, title: t("home.steps.s3.title"), desc: t("home.steps.s3.desc") },
    { icon: Truck, title: t("home.steps.s4.title"), desc: t("home.steps.s4.desc") },
  ]
  const testimonials = [0, 1, 2].map((i) => ({
    name: t(`home.testimonials.items.${i}.name`),
    text: t(`home.testimonials.items.${i}.text`),
  }))

  const socials = [
    { href: settings.instagram, label: "Instagram", icon: Instagram },
    { href: settings.facebook, label: "Facebook", icon: Facebook },
    { href: settings.tiktok, label: "TikTok", icon: Music2 },
  ].filter((s) => s.href)

  return (
    <div className="overflow-x-clip">
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="berber-grid relative flex min-h-[calc(100svh-4rem)] items-center"
        onMouseMove={onMouseMove}
        aria-label={t("common.nav.home")}
      >
        <ParticlesBackground />
        {/* Halo doré */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,color-mix(in_oklab,var(--gold)_9%,transparent),transparent)]"
        />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div className="text-center lg:text-start">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.hero.badge")}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
              className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl"
            >
              {L(settings, "heroTitle").split(",").map((part, i, arr) => (
                <span key={i}>
                  <span className={i === arr.length - 1 ? "text-gradient-gold" : undefined}>
                    {part.trim()}
                  </span>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.16, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              {L(settings, "heroSubtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24, ease: EASE }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <button
                onClick={() => navigate("/catalog")}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-7 font-semibold text-primary-foreground shadow-[0_10px_36px_-8px_color-mix(in_oklab,var(--gold)_60%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-8px_color-mix(in_oklab,var(--gold)_70%,transparent)] sm:w-auto"
              >
                {t("home.hero.cta1")}
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
              </button>
              <a
                href={whatsappLink(
                  lang === "ar"
                    ? "مرحبًا، أريد طلب فستان حسب القياس."
                    : "Bonjour, je souhaite commander une robe sur mesure."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="glass flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-jade/50 hover:text-jade sm:w-auto"
              >
                {t("home.hero.cta2")}
              </a>
            </motion.div>

            {/* Stats */}
            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-8 sm:gap-12 lg:justify-start"
            >
              {[
                { n: "8+", l: t("home.hero.stat1") },
                { n: "58", l: t("home.hero.stat2") },
                { n: "13", l: t("home.hero.stat3") },
              ].map((s) => (
                <div key={s.l} className="text-center lg:text-start">
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-2xl font-bold text-gold sm:text-3xl">{s.n}</dd>
                  <dd className="mt-1 max-w-[7rem] text-[11px] leading-tight text-muted-foreground sm:text-xs">
                    {s.l}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* Visuel avec parallaxe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ perspective: 1000 }}
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative"
            >
              <div className="glow-gold relative overflow-hidden rounded-[2rem] border border-gold/20">
                <SmartImage
                  src="/images/hero.jpg"
                  alt={lang === "ar" ? "فستان قبائلي تقليدي أحمر مطرز بالذهبي" : "Robe kabyle traditionnelle rouge brodée d'or"}
                  className="aspect-[3/4] w-full"
                  priority
                  sizes="(max-width: 1024px) 90vw, 45vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              {/* Chips flottantes */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="glass-strong absolute -start-3 top-8 flex items-center gap-2 rounded-2xl px-4 py-2.5 sm:-start-6"
                style={{ transform: "translateZ(40px)" }}
              >
                <Ruler className="h-4 w-4 text-gold" />
                <span className="text-xs font-semibold">{t("home.steps.s2.title")}</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="glass-strong absolute -end-3 bottom-10 flex items-center gap-2 rounded-2xl px-4 py-2.5 sm:-end-6"
                style={{ transform: "translateZ(30px)" }}
              >
                <Truck className="h-4 w-4 text-jade" />
                <span className="text-xs font-semibold">58 {t("home.hero.stat2")}</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Indicateur scroll */}
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="absolute inset-x-0 bottom-5 mx-auto hidden w-fit text-gold/70 lg:block"
          aria-hidden="true"
        >
          <ChevronDown />
        </motion.div>
      </section>

      {/* ═══════════ BANDEAU PROMO ═══════════ */}
      {settings.bannerEnabled && (
        <div className="border-y border-gold/25 bg-gold/5">
          <p className="berber-dots mx-auto max-w-7xl px-4 py-3 text-center text-sm font-medium text-gold sm:px-6">
            {L(settings, "bannerText")}
          </p>
        </div>
      )}

      {/* ═══════════ MODÈLES À LA UNE ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="featured-title">
        <SectionTitle
          kicker="ⵣ"
          title={t("home.featured.title")}
          subtitle={t("home.featured.subtitle")}
        />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured?.products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
          {!featured &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass aspect-[3/4] animate-pulse rounded-2xl" />
            ))}
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/catalog")}
            className="glass glow-gold-hover inline-flex h-12 items-center rounded-full px-8 font-semibold"
          >
            {t("common.actions.seeAll")}
          </button>
        </div>
      </section>

      {/* ═══════════ COLLECTIONS ═══════════ */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="cats-title">
          <SectionTitle title={t("home.categories.title")} subtitle={t("home.categories.subtitle")} />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat: CategoryDTO, i: number) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                onClick={() => navigate(`/catalog?category=${cat.slug}`)}
                className="group relative overflow-hidden rounded-2xl border border-border focus-visible:outline-gold"
              >
                <SmartImage
                  src={cat.image || "/images/products/p1.jpg"}
                  alt={L(cat, "name")}
                  className="aspect-[4/5] w-full"
                  sizes="(max-width: 640px) 90vw, 25vw"
                  imgClassName="transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-start">
                  <h3 className="font-display text-lg font-semibold text-white">{L(cat, "name")}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-white/70">{L(cat, "description")}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <BerberDivider variant="zigzag" className="opacity-50" />
      </div>

      {/* ═══════════ ÉTAPES ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="steps-title">
        <SectionTitle title={t("home.steps.title")} subtitle={t("home.steps.subtitle")} />
        <ol className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              className="glass relative rounded-2xl p-6"
            >
              <span className="absolute -top-3 start-6 flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-primary-foreground shadow-lg">
                {i + 1}
              </span>
              <s.icon className="mt-2 h-7 w-7 text-gold" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ═══════════ ATELIER ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="atelier-title">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative"
          >
            <div className="glow-gold overflow-hidden rounded-[2rem] border border-gold/15">
              <SmartImage
                src="/images/atelier.jpg"
                alt={lang === "ar" ? "يد حرفية تطرز نقوشًا أمازيغية ذهبية" : "Mains d'artisane brodant des motifs amazighs dorés"}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 1024px) 90vw, 45vw"
              />
            </div>
            <div className="glass-strong absolute -bottom-5 end-6 flex items-center gap-3 rounded-2xl px-5 py-3">
              <Scissors className="h-5 w-5 text-gold" />
              <span className="text-sm font-semibold">{t("home.atelier.title")}</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center lg:text-start"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">ⵣ Atelier</span>
            <h2 id="atelier-title" className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              {t("home.atelier.title")}
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">{t("home.atelier.text")}</p>
            <button
              onClick={() => navigate("/about")}
              className="glass glow-gold-hover mt-7 inline-flex h-12 items-center rounded-full px-7 font-semibold"
            >
              {t("home.atelier.cta")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TÉMOIGNAGES ═══════════ */}
      <section className="berber-grid relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="testi-title">
        <SectionTitle title={t("home.testimonials.title")} subtitle={t("home.testimonials.subtitle")} />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((tm, i) => (
            <motion.blockquote
              key={tm.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex gap-1 text-gold" aria-label="5/5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">“{tm.text}”</p>
              <footer className="mt-4 flex items-center gap-2 text-sm font-semibold text-gold">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                {tm.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6" aria-labelledby="cta-title">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="glass-strong glow-gold relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12"
        >
          <ParticlesBackground density={18} />
          <div className="relative">
            <span className="text-gold">
              <YazMark className="mx-auto h-12 w-12" />
            </span>
            <h2 id="cta-title" className="mt-5 font-display text-3xl font-bold sm:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("home.cta.subtitle")}</p>
            <a
              href={whatsappLink(
                lang === "ar"
                  ? "مرحبًا تاقندورث، أريد مناقشة طلب فستان."
                  : "Bonjour Taqendurt, je souhaite discuter d'une commande de robe."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-13 items-center gap-2.5 rounded-full bg-[#1faa53] px-8 py-3.5 font-semibold text-white shadow-[0_10px_36px_-8px_rgba(31,170,83,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-8px_rgba(31,170,83,0.7)]"
            >
              <WhatsAppGlyph className="h-5 w-5" />
              {t("home.cta.button")}
            </a>
            <div className="mt-8 flex items-center justify-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
                >
                  <s.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.27-.29.37-.39.1-.1.13-.17.2-.33.07-.16.03-.31-.03-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
    </svg>
  )
}

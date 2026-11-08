"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider, useI18n } from "@/components/providers/i18n-provider";
import { PublicDataProvider } from "@/components/providers/public-data-provider";
import { RouterProvider, useRouter } from "@/lib/router";
import { setLenis, scrollTop } from "@/lib/scroll";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { SplashScreen } from "@/components/layout/splash-screen";
import { YazMark } from "@/components/layout/berber-divider";
import { HomeView } from "@/components/home/home-view";

// ─────────────────────────────────────────────────────────────
// AppShell — SPA mono-route (#/…) : providers + transitions de
// pages (fondu + glissement), Lenis en différé, vues lourdes en
// dynamic import pour alléger le bundle initial.
// ─────────────────────────────────────────────────────────────

const ViewSkeleton = () => (
  <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
    <motion.div
      animate={{ opacity: [0.35, 1, 0.35], rotate: [0, 90, 180, 270, 360] }}
      transition={{ opacity: { duration: 1.4, repeat: Infinity }, rotate: { duration: 2.4, repeat: Infinity, ease: "linear" } }}
      className="text-gold/70"
      aria-label="Chargement"
    >
      <YazMark className="h-10 w-10" />
    </motion.div>
  </div>
)

const lazy = <P extends object>(loader: () => Promise<Record<string, unknown>>, name: string) =>
  dynamic(() => loader().then((m) => m[name] as React.ComponentType<P>), {
    ssr: false,
    loading: ViewSkeleton,
  })

const CatalogView = lazy<Record<string, never>>(() => import("@/components/catalog/catalog-view"), "CatalogView")
const ProductView = lazy<{ id: string }>(() => import("@/components/product/product-view"), "ProductView")
const CartView = lazy<Record<string, never>>(() => import("@/components/cart/cart-view"), "CartView")
const CheckoutView = lazy<Record<string, never>>(() => import("@/components/checkout/checkout-view"), "CheckoutView")
const ConfirmationView = lazy<{ number: string }>(() => import("@/components/confirmation/confirmation-view"), "ConfirmationView")
const TrackView = lazy<Record<string, never>>(() => import("@/components/track/track-view"), "TrackView")
const AboutView = lazy<Record<string, never>>(() => import("@/components/pages/about-view"), "AboutView")
const ContactView = lazy<Record<string, never>>(() => import("@/components/pages/contact-view"), "ContactView")
const SizeGuideView = lazy<Record<string, never>>(() => import("@/components/pages/size-guide-view"), "SizeGuideView")
const LegalView = lazy<{ slug: string }>(() => import("@/components/pages/legal-view"), "LegalView")
const AdminApp = lazy<Record<string, never>>(() => import("@/components/admin/admin-app"), "AdminApp")

/** Défilement fluide Lenis — différé, désactivé (reduced-motion / appareils faibles) */
function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    if (reduced || saveData) return

    let raf = 0
    let destroyed = false
    let lenis: { raf: (t: number) => void; destroy: () => void; scrollTo: (t: number | string, o?: Record<string, unknown>) => void } | null = null

    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.95 })
      setLenis(lenis)
      const loop = (time: number) => {
        lenis?.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      lenis?.destroy()
      setLenis(null)
    }
  }, [])
  return <>{children}</>
}

function NotFound() {
  const { t } = useI18n()
  const { navigate } = useRouter()
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <span className="text-gold/60">
        <YazMark className="h-16 w-16" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold">404 — {t("common.misc.error404")}</h1>
      <button
        onClick={() => navigate("/")}
        className="mt-6 rounded-full bg-gold px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        {t("common.actions.backHome")}
      </button>
    </section>
  )
}

function CurrentView() {
  const { path, segments } = useRouter()
  const { t } = useI18n()

  // Reset du scroll + titre de page à chaque changement de vue
  useEffect(() => {
    scrollTop(true)
    const titles: Record<string, string> = {
      "/": "Taqendurt — Robes kabyles",
      "/catalog": t("catalog.title"),
      "/cart": t("checkout.cart.title"),
      "/checkout": t("checkout.form.title"),
      "/track": t("checkout.track.title"),
      "/size-guide": t("common.nav.sizeGuide"),
      "/about": t("common.nav.about"),
      "/contact": t("common.nav.contact"),
      "/admin": "Admin",
    }
    let title = titles[path]
    if (!title && segments[0] === "product") title = t("catalog.title")
    if (!title && segments[0] === "legal") title = segments[1]
    if (!title && segments[0] === "confirmation") title = t("checkout.confirmation.title")
    document.title = title ? `${title} | Taqendurt` : "Taqendurt"
  }, [path, segments, t])

  let view: ReactNode
  const [root, param] = segments
  switch (root) {
    case undefined:
      view = <HomeView />
      break
    case "catalog":
      view = <CatalogView />
      break
    case "product":
      // key → remontage complet au changement de produit (reset d'état propre)
      view = param ? <ProductView key={param} id={param} /> : <NotFound />
      break
    case "cart":
      view = <CartView />
      break
    case "checkout":
      view = <CheckoutView />
      break
    case "confirmation":
      view = param ? <ConfirmationView number={param} /> : <NotFound />
      break
    case "track":
      view = <TrackView />
      break
    case "size-guide":
      view = <SizeGuideView />
      break
    case "about":
      view = <AboutView />
      break
    case "contact":
      view = <ContactView />
      break
    case "legal":
      view = <LegalView slug={param ?? "cgv"} />
      break
    case "admin":
      view = <AdminApp />
      break
    default:
      view = <NotFound />
  }

  // Transition entre vues : fondu + léger glissement (mode wait)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={path}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {view}
      </motion.div>
    </AnimatePresence>
  )
}

function Shell() {
  const { path } = useRouter()
  const isAdmin = path.startsWith("/admin")
  return (
    <div className="flex min-h-screen flex-col">
      <SplashScreen />
      <CustomCursor />
      {!isAdmin && <Navbar />}
      <main id="main" className="flex-1">
        {!isAdmin && <div className="h-16" aria-hidden="true" />}
        <CurrentView />
      </main>
      {!isAdmin && <Footer />}
      <WhatsAppButton />
    </div>
  )
}

export function AppShell() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <PublicDataProvider>
          <MotionConfig reducedMotion="user">
            <RouterProvider>
              <SmoothScroll>
                <Shell />
              </SmoothScroll>
            </RouterProvider>
          </MotionConfig>
        </PublicDataProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

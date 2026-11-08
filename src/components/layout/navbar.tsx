"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, ShoppingBag, Languages, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useI18n } from "@/components/providers/i18n-provider"
import { useTheme } from "@/components/providers/theme-provider"
import { useCart, cartCount } from "@/components/cart/cart-store"
import { useRouter } from "@/lib/router"
import { YazMark } from "./berber-divider"
import { usePublicData } from "@/components/providers/public-data-provider"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────
// Navbar — glassmorphism sticky, logo yaz ⵣ, switch FR/AR + thème,
// badge panier animé, menu mobile (Sheet). Cible tactile ≥44px.
// ─────────────────────────────────────────────────────────────

export function Navbar() {
  const { t, lang, setLang, L } = useI18n()
  const { theme, toggle } = useTheme()
  const { navigate, path } = useRouter()
  const items = useCart((s) => s.items)
  const { settings } = usePublicData()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const mounted = useMounted()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const count = mounted ? cartCount(items) : 0
  const siteName = L(settings, "siteName") || "Taqendurt"

  const links: { to: string; label: string }[] = [
    { to: "/", label: t("common.nav.home") },
    { to: "/catalog", label: t("common.nav.catalog") },
    { to: "/about", label: t("common.nav.about") },
    { to: "/contact", label: t("common.nav.contact") },
  ]

  const isActive = (to: string) =>
    to === "/" ? path === "/" || path === "" : path.startsWith(to)

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong shadow-lg shadow-black/10" : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Navigation principale">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault()
            go("/")
          }}
          className="group flex min-h-11 items-center gap-2.5"
        >
          <span className="text-gold transition-transform duration-300 group-hover:rotate-45">
            <YazMark className="h-8 w-8" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {siteName.split("—")[0].trim()}
          </span>
        </Link>

        {/* Liens desktop */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <button
                onClick={() => go(l.to)}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  "hover:text-gold",
                  isActive(l.to) ? "text-gold" : "text-foreground/80"
                )}
              >
                {l.label}
                {isActive(l.to) && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
            aria-label={t("common.lang.switch")}
            title={t("common.lang.switch")}
          >
            <Languages className="h-4 w-4" />
            <span>{lang === "fr" ? "AR" : "FR"}</span>
          </button>

          <button
            onClick={toggle}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-gold"
            aria-label={t("common.theme.toggle")}
            title={t("common.theme.toggle")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => go("/cart")}
            data-cart-button
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-gold"
            aria-label={`${t("common.nav.cart")} (${count})`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-primary-foreground"
              >
                {count}
              </span>
            )}
          </button>

          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 md:hidden"
                aria-label={t("common.nav.menu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={lang === "ar" ? "right" : "left"} className="glass-strong w-72">
              <SheetTitle className="flex items-center gap-2 font-display">
                <span className="text-gold">
                  <YazMark className="h-6 w-6" />
                </span>
                {siteName.split("—")[0].trim()}
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {[...links, { to: "/size-guide", label: t("common.nav.sizeGuide") }, { to: "/track", label: t("common.nav.track") }].map((l) => (
                  <button
                    key={l.to}
                    onClick={() => go(l.to)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-start text-base font-medium transition-colors",
                      isActive(l.to)
                        ? "bg-gold/10 text-gold"
                        : "text-foreground/80 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
                <div className="my-2 h-px bg-border" />
                <button
                  onClick={() => go("/admin")}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-start text-sm text-muted-foreground transition-colors hover:bg-accent"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("common.nav.admin")}
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}

"use client";

// ─────────────────────────────────────────────────────────────
// AdminApp — shell du back-office (task C). Sous-routes via hash :
// #/admin (dashboard), #/admin/orders[/:id], #/admin/products[/:id|/new],
// #/admin/options, #/admin/shipping, #/admin/messages, #/admin/settings
// Auth : GET /api/admin/me → sinon écran de connexion (AdminLogin).
// Rôle « staff » : commandes + messages + dashboard uniquement.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Shapes,
  Truck,
  Mail,
  Settings,
  LogOut,
  Languages,
  Store,
  Loader2,
} from "lucide-react";
import { api, setSessionToken } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import { useI18n } from "@/components/providers/i18n-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { YazMark } from "@/components/layout/berber-divider";
import type { AdminUserDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdminLogin } from "./admin-login";
import { DashboardView } from "./dashboard-view";
import { OrdersView } from "./orders-view";
import { OrderDetailView } from "./order-detail-view";
import { ProductsView } from "./products-view";
import { ProductEditor } from "./product-editor";
import { OptionsView } from "./options-view";
import { ShippingView } from "./shipping-view";
import { MessagesView } from "./messages-view";
import { SettingsView } from "./settings-view";

interface NavItem {
  section: string
  labelKey: string
  icon: typeof LayoutDashboard
  adminOnly: boolean
  match: (s: string[]) => boolean
}

const NAV: NavItem[] = [
  { section: "", labelKey: "admin.shell.nav.dashboard", icon: LayoutDashboard, adminOnly: false, match: (s) => s.length === 0 },
  { section: "orders", labelKey: "admin.shell.nav.orders", icon: ShoppingBag, adminOnly: false, match: (s) => s[0] === "orders" },
  { section: "products", labelKey: "admin.shell.nav.products", icon: Shirt, adminOnly: true, match: (s) => s[0] === "products" },
  { section: "options", labelKey: "admin.shell.nav.options", icon: Shapes, adminOnly: true, match: (s) => s[0] === "options" },
  { section: "shipping", labelKey: "admin.shell.nav.shipping", icon: Truck, adminOnly: true, match: (s) => s[0] === "shipping" },
  { section: "messages", labelKey: "admin.shell.nav.messages", icon: Mail, adminOnly: false, match: (s) => s[0] === "messages" },
  { section: "settings", labelKey: "admin.shell.nav.settings", icon: Settings, adminOnly: true, match: (s) => s[0] === "settings" },
]

export function AdminApp() {
  const { t, lang, setLang } = useI18n()
  const { theme, toggle } = useTheme()
  const { segments, navigate } = useRouter()
  const [user, setUser] = useState<AdminUserDTO | null>(null)
  const [checking, setChecking] = useState(true)

  const checkSession = useCallback(() => {
    api<{ user: AdminUserDTO }>("/api/admin/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const logout = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" })
    } catch {}
    // Efface aussi le token iframe (cookies tiers bloqués)
    setSessionToken(null)
    setUser(null)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-label={t("common.actions.loading")} />
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={(u) => setUser(u)} />
  }

  // segments relatifs après "admin"
  const sub = segments.slice(1)
  const section = sub[0] ?? ""

  let view: React.ReactNode
  switch (section) {
    case "":
      view = <DashboardView user={user} />
      break
    case "orders":
      view = sub[1] ? <OrderDetailView id={sub[1]} user={user} /> : <OrdersView user={user} />
      break
    case "products":
      if (sub[1] === "new") view = <ProductEditor />
      else if (sub[1]) view = <ProductEditor id={sub[1]} />
      else view = <ProductsView />
      break
    case "options":
      view = <OptionsView />
      break
    case "shipping":
      view = <ShippingView />
      break
    case "messages":
      view = <MessagesView />
      break
    case "settings":
      view = <SettingsView user={user} />
      break
    default:
      view = <DashboardView user={user} />
  }

  const navItems = NAV.filter((n) => !n.adminOnly || user.role === "admin")

  return (
    <div className="min-h-screen bg-background">
      {/* Barre supérieure */}
      <header className="glass-strong sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <span className="text-gold">
              <YazMark className="h-7 w-7" />
            </span>
            <span className="font-display text-sm font-semibold">
              {t("admin.shell.title")} — Taqendurt
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:text-gold"
              aria-label={t("common.lang.switch")}
            >
              <Languages className="h-4 w-4" />
              {lang === "fr" ? "AR" : "FR"}
            </button>
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-gold"
              aria-label={t("common.theme.toggle")}
            >
              {theme === "dark" ? "☀︎" : "☾"}
            </button>
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault()
                navigate("/")
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-gold"
              aria-label={t("admin.shell.backToSite")}
              title={t("admin.shell.backToSite")}
            >
              <Store className="h-4 w-4" />
            </Link>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-xs text-muted-foreground sm:block">
              {user.name} · {user.role}
            </span>
            <button
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400"
              aria-label={t("admin.shell.logout")}
              title={t("admin.shell.logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Navigation latérale (desktop) */}
        <nav className="sticky top-20 hidden h-fit w-52 shrink-0 flex-col gap-1 md:flex" aria-label={t("admin.shell.title")}>
          {navItems.map((n) => {
            const active = n.match(sub)
            return (
              <button
                key={n.section || "dashboard"}
                onClick={() => navigate(`/admin/${n.section}`)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gold/12 text-gold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <n.icon className="h-4 w-4" />
                {t(n.labelKey)}
              </button>
            )
          })}
        </nav>

        {/* Navigation horizontale (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 py-1.5 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }} aria-label={t("admin.shell.title")}>
          {navItems.slice(0, 5).map((n) => {
            const active = n.match(sub)
            return (
              <button
                key={n.section || "dashboard"}
                onClick={() => navigate(`/admin/${n.section}`)}
                className={cn(
                  "flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                  active ? "text-gold" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate">{t(n.labelKey).split(" ")[0]}</span>
              </button>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-0">{view}</main>
      </div>
    </div>
  )
}

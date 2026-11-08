"use client";

import { Instagram, Facebook, Phone, Mail, MapPin, Music2, LockKeyhole, ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/components/providers/i18n-provider"
import { usePublicData } from "@/components/providers/public-data-provider"
import { useRouter } from "@/lib/router"
import { BerberDivider, YazMark } from "./berber-divider"

// ─────────────────────────────────────────────────────────────
// Footer — collé au bas de la fenêtre (flex + mt-auto), colonnes
// marque / navigation / aide / contact, bandeau réseaux sociaux.
// ─────────────────────────────────────────────────────────────

export function Footer() {
  const { t, lang, L } = useI18n()
  const { navigate } = useRouter()
  const { settings, whatsappLink } = usePublicData()

  const quickLinks = [
    { to: "/", label: t("common.nav.home") },
    { to: "/catalog", label: t("common.nav.catalog") },
    { to: "/about", label: t("common.nav.about") },
    { to: "/contact", label: t("common.nav.contact") },
  ]
  const helpLinks = [
    { to: "/size-guide", label: t("common.nav.sizeGuide") },
    { to: "/track", label: t("common.nav.track") },
    { to: "/legal/cgv", label: "CGV" },
    { to: "/legal/returns", label: lang === "ar" ? "الإرجاع والتبديل" : "Retour / Échange" },
    { to: "/legal/privacy", label: lang === "ar" ? "الخصوصية" : "Confidentialité" },
  ]

  const socials = [
    { href: settings.instagram, label: "Instagram", icon: Instagram },
    { href: settings.facebook, label: "Facebook", icon: Facebook },
    { href: settings.tiktok, label: "TikTok", icon: Music2 },
  ].filter((s) => s.href)

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-gold">
                <YazMark className="h-8 w-8" />
              </span>
              <span className="font-display text-lg font-semibold">
                {(L(settings, "siteName") || "Taqendurt").split("—")[0].trim()}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {L(settings, "tagline")}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
              {t("common.footer.payment")}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label={t("common.footer.quickLinks")}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              {t("common.footer.quickLinks")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <button
                    onClick={() => navigate(l.to)}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Aide */}
          <nav aria-label={t("common.footer.help")}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              {t("common.footer.help")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {helpLinks.map((l) => (
                <li key={l.to}>
                  <button
                    onClick={() => navigate(l.to)}
                    className="text-sm text-muted-foreground transition-colors hover:text-gold"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              {t("common.footer.contactUs")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {settings.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                  <span dir="ltr">{settings.phone}</span>
                </li>
              )}
              {settings.email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                  <span dir="ltr">{settings.email}</span>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                <span>{L(settings, "address")}</span>
              </li>
            </ul>
            {/* Réseaux sociaux */}
            <div className="mt-5 flex items-center gap-2">
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
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-jade/40 bg-jade/10 text-jade transition-all hover:-translate-y-0.5 hover:bg-jade/20"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.27-.29.37-.39.1-.1.13-.17.2-.33.07-.16.03-.31-.03-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <BerberDivider variant="zigzag" className="opacity-60" />
        </div>

        {/* Espace Admin — accès équipe : mène à la page de connexion #/admin */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate("/admin")}
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-gold/30 bg-gold/5 px-5 py-2.5 text-sm font-semibold text-gold transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <LockKeyhole className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
            <span>{t("common.footer.adminArea")}</span>
            <span className="text-xs font-normal text-muted-foreground">
              · {t("common.footer.adminAreaHint")}
            </span>
            {lang === "ar" ? (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-start">
          <p>
            © {new Date().getFullYear()} {(L(settings, "siteName") || "Taqendurt").split("—")[0].trim()}. {t("common.footer.rights")}.
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-gold">ⵣ</span> {t("common.footer.madeIn")}
          </p>
        </div>
      </div>
    </footer>
  )
}

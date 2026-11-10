"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus, ArrowUpSquare } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

// ─────────────────────────────────────────────────────────────
// Invitation à installer la PWA — s'affiche à la première visite
// Android : bouton natif beforeinstallprompt
// iOS Safari : guide illustré "Partager > Sur l'écran d'accueil"
// ─────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const { t, lang } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Détecter si déjà installé (mode standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);

    // Détecter iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(ios);

    // Ne pas afficher si déjà installé
    if (standalone) return;

    // Vérifier si déjà refusé
    const dismissed = localStorage.getItem("rk-install-dismissed");
    if (dismissed) return;

    // Vérifier si première visite
    const visited = localStorage.getItem("rk-visited");
    if (!visited) {
      localStorage.setItem("rk-visited", "true");
      // Afficher après 3 secondes sur la première visite
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android : capturer beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Afficher après 5 secondes sur les visites suivantes
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt natif Android
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installée");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem("rk-install-dismissed", "true");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("rk-install-dismissed", "true");
  };

  // Ne rien afficher si déjà installé
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Carte d'invitation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-md rounded-2xl border border-gold/30 bg-card p-6 shadow-2xl sm:bottom-8"
            style={{
              paddingBottom: "max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))",
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={handleDismiss}
              className="absolute end-4 top-4 rounded-full p-2 transition-colors hover:bg-muted"
              aria-label={t("common.actions.close")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Contenu */}
            <div className="pe-8">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-strong">
                  <svg
                    className="h-8 w-8 text-primary-foreground"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16 5 L27 16 L16 27 L5 16 Z" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
                    <path d="M16 9.5 L22.5 16 L16 22.5 L9.5 16 Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 13 L19 16 L16 19 L13 16 Z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {lang === "ar" ? "قم بتثبيت التطبيق" : "Installer l'application"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar"
                      ? "للوصول السريع والتجربة المثلى"
                      : "Pour un accès rapide et une meilleure expérience"}
                  </p>
                </div>
              </div>

              {/* Android : bouton natif */}
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Download className="h-5 w-5" />
                  {lang === "ar" ? "تثبيت" : "Installer maintenant"}
                </button>
              )}

              {/* iOS : guide illustré */}
              {isIOS && (
                <div className="mt-6 space-y-3 rounded-xl bg-muted/50 p-4">
                  <p className="text-sm font-medium">
                    {lang === "ar" ? "لتثبيت التطبيق على iOS:" : "Pour installer l'app sur iOS :"}
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                        1
                      </span>
                      <span className="flex items-center gap-2">
                        {lang === "ar" ? "اضغط على زر" : "Appuyez sur le bouton"}
                        <Share className="inline h-4 w-4 text-gold" />
                        {lang === "ar" ? "(المشاركة) في الأسفل" : "(Partager) en bas"}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                        2
                      </span>
                      <span className="flex items-center gap-2">
                        {lang === "ar" ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Choisissez "Sur l\'écran d\'accueil"'}
                        <Plus className="inline h-4 w-4 text-gold" />
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Avantages */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  {lang === "ar" ? "بدون تحميلات" : "Sans téléchargement"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  {lang === "ar" ? "عمل دون اتصال" : "Fonctionne hors-ligne"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  {lang === "ar" ? "أسرع" : "Plus rapide"}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

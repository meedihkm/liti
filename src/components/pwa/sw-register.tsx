"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

// ─────────────────────────────────────────────────────────────
// Enregistrement du Service Worker + bandeau de mise à jour douce
// ─────────────────────────────────────────────────────────────

export function ServiceWorkerRegister() {
  const { t, lang } = useI18n();
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker enregistré", registration.scope);

        // Détecter une mise à jour en attente
        const checkForUpdate = () => {
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
          }
        };

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        });

        checkForUpdate();

        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error("[PWA] Erreur d'enregistrement du SW:", error);
      }
    };

    registerSW();
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;

    // Demander au SW en attente de prendre le contrôle
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Rafraîchir la page après activation
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed inset-x-4 top-4 z-[999] mx-auto max-w-md"
        >
          <div className="glass-strong flex items-center justify-between gap-4 rounded-full border border-gold/40 px-5 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-gold" />
              <p className="text-sm font-medium">
                {lang === "ar" ? "إصدار جديد متاح" : "Nouvelle version disponible"}
              </p>
            </div>
            <button
              onClick={handleUpdate}
              className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              {lang === "ar" ? "تحديث" : "Mettre à jour"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

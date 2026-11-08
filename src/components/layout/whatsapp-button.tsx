"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePublicData } from "@/components/providers/public-data-provider";
import { useRouter } from "@/lib/router";

// Bouton WhatsApp flottant — masqué dans l'admin, visible mobile+desktop,
// micro-animation d'apparition et halo doux.
export function WhatsAppButton() {
  const { t } = useI18n()
  const { whatsappLink } = usePublicData()
  const { path } = useRouter()

  // Masqué dans l'admin (interface propre) et sur la fiche produit
  // (le configurateur possède déjà son CTA WhatsApp + barre prix)
  if (path.startsWith("/admin") || path.startsWith("/product")) return null

  return (
    <motion.a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("common.actions.whatsapp")}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1faa53] text-white shadow-[0_8px_30px_-6px_rgba(31,170,83,0.6)] transition-shadow hover:shadow-[0_10px_36px_-4px_rgba(31,170,83,0.75)] ltr:right-5 rtl:left-5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.24-.02-.38.11-.5.11-.11.27-.29.37-.39.1-.1.13-.17.2-.33.07-.16.03-.31-.03-.43-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
      </svg>
    </motion.a>
  )
}

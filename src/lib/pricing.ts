// ─────────────────────────────────────────────────────────────
// Calcul des prix — logique UNIQUE partagée client (estimation)
// et serveur (recalcul autoritaire, ne jamais faire confiance
// au prix envoyé par le navigateur).
// ─────────────────────────────────────────────────────────────

export interface UnitPriceInput {
  basePrice: number
  fabricExtra: number
  embroideryExtras: number[]
  isCustomSize: boolean
  customSizeFee: number
}

/** Prix unitaire = base + tissu + broderies + sur-mesure (hors livraison) */
export function computeUnitPrice(input: UnitPriceInput): number {
  let unit = input.basePrice + (input.fabricExtra || 0)
  for (const extra of input.embroideryExtras) unit += extra || 0
  if (input.isCustomSize) unit += input.customSizeFee || 0
  return Math.max(0, Math.round(unit))
}

/** Montant total de la commande = sous-total + frais de livraison */
export function computeOrderTotal(
  lines: { unitPrice: number; quantity: number }[],
  shippingFee: number
): { subtotal: number; total: number } {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  return { subtotal, total: subtotal + (shippingFee || 0) }
}

/** Format monétaire : 12 500 DA / 12 500 دج */
export function formatDA(amount: number, lang: "fr" | "ar" | "kab" = "fr"): string {
  const locale = lang === "ar" ? "ar-DZ" : lang === "kab" ? "kab-DZ" : "fr-FR";
  const formatted = new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
  return `${formatted} ${lang === "ar" ? "دج" : "DA"}`
}

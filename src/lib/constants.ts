// ─────────────────────────────────────────────────────────────
// Constantes métier : wilayas, statuts, tailles, occasions
// ─────────────────────────────────────────────────────────────

/**
 * Marqueur anti-CSRF partagé client/serveur : le client SPA pose
 * l'en-tête X-Requested-With sur chaque appel, le serveur le vérifie
 * (sameOriginGuard). Un site tiers ne peut pas forger cet en-tête
 * cross-origin sans préflight favorable — que l'API n'accorde jamais.
 */
export const CSRF_MARKER = "taqendurt-spa"

export interface Wilaya {
  code: number
  name: string
  nameAr: string
}

// Les 58 wilayas d'Algérie
export const WILAYAS: Wilaya[] = [
  { code: 1, name: "Adrar", nameAr: "أدرار" },
  { code: 2, name: "Chlef", nameAr: "الشلف" },
  { code: 3, name: "Laghouat", nameAr: "الأغواط" },
  { code: 4, name: "Oum El Bouaghi", nameAr: "أم البواقي" },
  { code: 5, name: "Batna", nameAr: "باتنة" },
  { code: 6, name: "Béjaïa", nameAr: "بجاية" },
  { code: 7, name: "Biskra", nameAr: "بسكرة" },
  { code: 8, name: "Béchar", nameAr: "بشار" },
  { code: 9, name: "Blida", nameAr: "البليدة" },
  { code: 10, name: "Bouira", nameAr: "البويرة" },
  { code: 11, name: "Tamanrasset", nameAr: "تمنراست" },
  { code: 12, name: "Tébessa", nameAr: "تبسة" },
  { code: 13, name: "Tlemcen", nameAr: "تلمسان" },
  { code: 14, name: "Tiaret", nameAr: "تيارت" },
  { code: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو" },
  { code: 16, name: "Alger", nameAr: "الجزائر" },
  { code: 17, name: "Djelfa", nameAr: "الجلفة" },
  { code: 18, name: "Jijel", nameAr: "جيجل" },
  { code: 19, name: "Sétif", nameAr: "سطيف" },
  { code: 20, name: "Saïda", nameAr: "سعيدة" },
  { code: 21, name: "Skikda", nameAr: "سكيكدة" },
  { code: 22, name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس" },
  { code: 23, name: "Annaba", nameAr: "عنابة" },
  { code: 24, name: "Guelma", nameAr: "قالمة" },
  { code: 25, name: "Constantine", nameAr: "قسنطينة" },
  { code: 26, name: "Médéa", nameAr: "المدية" },
  { code: 27, name: "Mostaganem", nameAr: "مستغانم" },
  { code: 28, name: "M'Sila", nameAr: "المسيلة" },
  { code: 29, name: "Mascara", nameAr: "معسكر" },
  { code: 30, name: "Ouargla", nameAr: "ورقلة" },
  { code: 31, name: "Oran", nameAr: "وهران" },
  { code: 32, name: "El Bayadh", nameAr: "البيض" },
  { code: 33, name: "Illizi", nameAr: "إليزي" },
  { code: 34, name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج" },
  { code: 35, name: "Boumerdès", nameAr: "بومرداس" },
  { code: 36, name: "El Tarf", nameAr: "الطارف" },
  { code: 37, name: "Tindouf", nameAr: "تندوف" },
  { code: 38, name: "Tissemsilt", nameAr: "تيسمسيلت" },
  { code: 39, name: "El Oued", nameAr: "الوادي" },
  { code: 40, name: "Khenchela", nameAr: "خنشلة" },
  { code: 41, name: "Souk Ahras", nameAr: "سوق أهراس" },
  { code: 42, name: "Tipaza", nameAr: "تيبازة" },
  { code: 43, name: "Mila", nameAr: "ميلة" },
  { code: 44, name: "Aïn Defla", nameAr: "عين الدفلى" },
  { code: 45, name: "Naâma", nameAr: "النعامة" },
  { code: 46, name: "Aïn Témouchent", nameAr: "عين تموشنت" },
  { code: 47, name: "Ghardaïa", nameAr: "غرداية" },
  { code: 48, name: "Relizane", nameAr: "غليزان" },
  { code: 49, name: "El M'Ghair", nameAr: "المغير" },
  { code: 50, name: "El Meniaa", nameAr: "المنيعة" },
  { code: 51, name: "Ouled Djellal", nameAr: "أولاد جلال" },
  { code: 52, name: "Bordj Baji Mokhtar", nameAr: "برج باجي مختار" },
  { code: 53, name: "Béni Abbès", nameAr: "بني عباس" },
  { code: 54, name: "Timimoun", nameAr: "تيميمون" },
  { code: 55, name: "Touggourt", nameAr: "تقرت" },
  { code: 56, name: "Djanet", nameAr: "جانت" },
  { code: 57, name: "In Salah", nameAr: "عين صالح" },
  { code: 58, name: "In Guezzam", nameAr: "عين قزام" },
]

export function wilayaByCode(code: number): Wilaya | undefined {
  return WILAYAS.find((w) => w.code === code)
}

// Frais de livraison par défaut (DA) — zone centre / est / ouest / sud
// La grille réelle est stockée en base (ShippingRate) et modifiable dans l'admin.
export const DEFAULT_SHIPPING: Record<number, number> = {}
for (const w of WILAYAS) {
  if (w.code === 16) DEFAULT_SHIPPING[w.code] = 400 // Alger
  else if ([9, 15, 35, 42, 6, 10].includes(w.code)) DEFAULT_SHIPPING[w.code] = 500 // grande banlieue + Kabylie
  else if ([2, 26, 44, 34, 48, 13, 38, 46, 27, 29].includes(w.code)) DEFAULT_SHIPPING[w.code] = 650 // centre/ouest
  else if ([4, 5, 12, 18, 19, 21, 23, 24, 25, 36, 40, 41, 43, 20, 22, 31].includes(w.code)) DEFAULT_SHIPPING[w.code] = 750 // est/ouest
  else if ([3, 7, 17, 28, 30, 39, 47, 49, 50, 51, 55].includes(w.code)) DEFAULT_SHIPPING[w.code] = 900 // hauts plateaux / sud
  else DEFAULT_SHIPPING[w.code] = 1200 // grand sud
}

// ── Statuts de commande ───────────────────────────────────────

export const ORDER_STATUSES = [
  "pending",
  "validated",
  "crafting",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
  "refused",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_LABELS: Record<string, { fr: string; ar: string }> = {
  pending: { fr: "En attente", ar: "في الانتظار" },
  validated: { fr: "Validée", ar: "مصادق عليها" },
  crafting: { fr: "En confection", ar: "قيد الخياطة" },
  ready: { fr: "Prête", ar: "جاهزة" },
  shipped: { fr: "Expédiée", ar: "تم الإرسال" },
  delivered: { fr: "Livrée", ar: "تم التسليم" },
  cancelled: { fr: "Annulée", ar: "ملغاة" },
  refused: { fr: "Refusée", ar: "مرفوضة" },
}

// Classes visuelles par statut (badges admin + suivi client)
export const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  validated: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  crafting: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  ready: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  shipped: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  refused: "bg-red-500/15 text-red-400 border-red-500/30",
}

// ── Tailles & mesures ─────────────────────────────────────────

export const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"] as const

export const MEASUREMENT_FIELDS = [
  { key: "chest", fr: "Tour de poitrine", ar: "محيط الصدر", min: 60, max: 160 },
  { key: "waist", fr: "Tour de taille", ar: "محيط الخصر", min: 50, max: 150 },
  { key: "hips", fr: "Tour de hanches", ar: "محيط الوركين", min: 60, max: 170 },
  { key: "length", fr: "Longueur totale", ar: "الطول الكلي", min: 80, max: 170 },
  { key: "sleeve", fr: "Longueur de manche", ar: "طول الكم", min: 30, max: 75 },
  { key: "shoulders", fr: "Largeur d'épaules", ar: "عرض الكتفين", min: 30, max: 60 },
] as const

export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number]["key"]

// ── Occasions & longueurs ─────────────────────────────────────

export const OCCASIONS = [
  { value: "mariage", fr: "Mariage", ar: "زفاف" },
  { value: "fiancailles", fr: "Fiançailles", ar: "خطوبة" },
  { value: "fete", fr: "Fête / cérémonie", ar: "حفلة" },
  { value: "quotidien", fr: "Quotidien", ar: "يومي" },
] as const

export const LENGTHS = [
  { value: "courte", fr: "Courte", ar: "قصيرة" },
  { value: "mi-longue", fr: "Mi-longue", ar: "متوسطة" },
  { value: "longue", fr: "Longue", ar: "طويلة" },
] as const

export const CURRENCY = { fr: "DA", ar: "دج" } as const

// Numéro de commande lisible : RK-2026-0001
export function buildOrderNumber(seq: number, year = new Date().getFullYear()): string {
  return `RK-${year}-${String(seq).padStart(4, "0")}`
}

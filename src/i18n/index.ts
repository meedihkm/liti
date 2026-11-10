// ─────────────────────────────────────────────────────────────
// i18n — noyau : fusion des dictionnaires par domaine + t()
// Langues : fr (défaut), ar (RTL), kab (tamazight/kabyle)
// ─────────────────────────────────────────────────────────────
import { common } from "./dict/common"
import { home } from "./dict/home"
import { catalog } from "./dict/catalog"
import { product } from "./dict/product"
import { checkout } from "./dict/checkout"
import { pages } from "./dict/pages"
import { admin } from "./dict/admin"

export type Lang = "fr" | "ar" | "kab"
export type Dir = "ltr" | "rtl"

export const LANGS: { code: Lang; label: string; dir: Dir }[] = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "kab", label: "Taqbaylit", dir: "ltr" },
]

export function dirOf(lang: Lang): Dir {
  return lang === "ar" ? "rtl" : "ltr"
}

/** Get the localized suffix for database fields (Ar, Kab) */
export function getLocaleSuffix(lang: Lang): string {
  if (lang === "ar") return "Ar"
  if (lang === "kab") return "Kab"
  return ""
}

// Fusion profonde : fr sert de base (clés manquantes → fallback fr)
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}

const frDict = deepMerge(
  {},
  {
    common: common.fr,
    home: home.fr,
    catalog: catalog.fr,
    product: product.fr,
    checkout: checkout.fr,
    pages: pages.fr,
    admin: admin.fr,
  } as Record<string, unknown>
)

const arDict = deepMerge(frDict, {
  common: common.ar,
  home: home.ar,
  catalog: catalog.ar,
  product: product.ar,
  checkout: checkout.ar,
  pages: pages.ar,
  admin: admin.ar,
} as Record<string, unknown>)

const kabDict = deepMerge(frDict, {
  common: common.kab,
  home: home.kab,
  catalog: catalog.kab,
  product: product.kab,
  checkout: checkout.kab,
  pages: pages.kab,
  admin: admin.kab,
} as Record<string, unknown>)

const DICTS: Record<Lang, Record<string, unknown>> = { fr: frDict, ar: arDict, kab: kabDict }

function lookup(dict: Record<string, unknown>, key: string): unknown {
  let node: unknown = dict
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return node
}

/**
 * Traduction : t('checkout.total', {amount: '12 500 DA'})
 * → fallback : la clé elle-même si absente (facilite le debug)
 */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let value = lookup(DICTS[lang], key) ?? lookup(DICTS.fr, key)
  if (typeof value !== "string") return key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = (value as string).replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
    }
  }
  return value as string
}

/** Choisit le champ localisé d'un objet { title, titleAr, titleKab } */
export function pickLocalized<T extends object>(lang: Lang, obj: T, baseKey: string): string {
  const asRecord = obj as Record<string, unknown>
  if (lang === "ar") {
    const arKey = `${baseKey}Ar`
    const val = asRecord[arKey]
    if (typeof val === "string" && val) return val
  }
  if (lang === "kab") {
    const kabKey = `${baseKey}Kab`
    const val = asRecord[kabKey]
    if (typeof val === "string" && val) return val
  }
  const val = asRecord[baseKey]
  return typeof val === "string" ? val : ""
}

export const t = translate

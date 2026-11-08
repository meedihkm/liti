"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { translate, pickLocalized, dirOf, type Lang, type Dir } from "@/i18n";

// ─────────────────────────────────────────────────────────────
// Provider i18n : langue courante, direction RTL, t() et L().
// Source de vérité = <html lang> (posée côté serveur « fr »,
// ajustée avant peinture par le script inline si mémorisée).
// Abonnement via mini store externe — pas d'effet, pas de flash.
// Prêt pour « kab » : ajouter le dictionnaire (voir src/i18n).
// ─────────────────────────────────────────────────────────────

const listeners = new Set<() => void>();

function subscribeLang(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getLangSnapshot(): Lang {
  return document.documentElement.lang === "ar" ? "ar" : "fr";
}

function setLangValue(next: Lang) {
  document.documentElement.lang = next;
  document.documentElement.dir = dirOf(next);
  try {
    window.localStorage.setItem("rk-lang", next);
  } catch {}
  for (const l of listeners) l();
}

interface I18nContextValue {
  lang: Lang;
  dir: Dir;
  isRTL: boolean;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  L: <T extends object>(obj: T, baseKey: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "fr",
  dir: "ltr",
  isRTL: false,
  setLang: () => {},
  t: (key) => key,
  L: (obj, baseKey) => String((obj as Record<string, unknown>)[baseKey] ?? ""),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, () => "fr" as Lang);

  const setLang = useCallback((next: Lang) => setLangValue(next), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  const L = useCallback(
    <T extends object>(obj: T, baseKey: string) => pickLocalized(lang, obj, baseKey),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, dir: dirOf(lang), isRTL: lang === "ar", setLang, t, L }),
    [lang, setLang, t, L]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

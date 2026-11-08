"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { PublicSettings, CategoryDTO, FabricDTO, ColorDTO, EmbroideryDTO } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Données publiques partagées (paramètres du site, catégories,
// listes globales tissus/couleurs/broderies) — un seul fetch.
// ─────────────────────────────────────────────────────────────

interface MetaResponse {
  settings: PublicSettings;
  categories: CategoryDTO[];
  fabrics: FabricDTO[];
  colors: ColorDTO[];
  embroideries: EmbroideryDTO[];
  /** frais de livraison publics : { wilayaCode → homePrice } */
  shippingRates: Record<string, number>;
}

interface PublicDataContextValue extends MetaResponse {
  ready: boolean;
  refresh: () => void;
  /** construit un lien wa.me avec message pré-rempli */
  whatsappLink: (message?: string) => string;
}

const fallback: MetaResponse = {
  settings: DEFAULT_SETTINGS,
  categories: [],
  fabrics: [],
  colors: [],
  embroideries: [],
  shippingRates: {},
};

const PublicDataContext = createContext<PublicDataContextValue>({
  ...fallback,
  ready: false,
  refresh: () => {},
  whatsappLink: () => "https://wa.me/",
});

export function PublicDataProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaResponse>(fallback);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<MetaResponse>("/api/meta")
      .then((data) => {
        if (!cancelled) setMeta({ ...fallback, ...data })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const whatsappLink = useCallback(
    (message?: string) => {
      const number = meta.settings.whatsapp?.replace(/\D/g, "") || "213550123456";
      const text = encodeURIComponent(
        message ?? "Bonjour Taqendurt, j'ai une question sur vos robes kabyles."
      );
      return `https://wa.me/${number}?text=${text}`;
    },
    [meta.settings.whatsapp]
  );

  const value = useMemo(
    () => ({ ...meta, ready, refresh, whatsappLink }),
    [meta, ready, refresh, whatsappLink]
  );

  return <PublicDataContext.Provider value={value}>{children}</PublicDataContext.Provider>;
}

export function usePublicData(): PublicDataContextValue {
  return useContext(PublicDataContext);
}

"use client";

// ─────────────────────────────────────────────────────────────
// Routeur hash SPA — seule la route / est exposée (contrainte
// sandbox/preview). Souscrit au hash via useSyncExternalStore
// (pattern moderne : pas de setState synchrone en effet).
// Transitions de pages : framer-motion (AnimatePresence) dans
// AppShell — cohérentes sur tous les navigateurs.
// ─────────────────────────────────────────────────────────────
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface RouteInfo {
  /** chemin sans # ni query, ex: /product/abc */
  path: string;
  /** segments découpés, ex: ["product", "abc"] */
  segments: string[];
  /** query de l'hash, ex: ?cat=x */
  query: URLSearchParams;
}

interface RouterContextValue extends RouteInfo {
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue>({
  path: "/",
  segments: [],
  query: new URLSearchParams(),
  navigate: () => {},
});

function parseHash(hash: string): RouteInfo {
  const raw = (hash || "").replace(/^#/, "");
  const [pathPart, queryPart] = raw.split("?");
  const path = pathPart && pathPart.startsWith("/") ? pathPart : `/${pathPart || ""}`;
  const segments = path.split("/").filter(Boolean);
  return { path, segments, query: new URLSearchParams(queryPart ?? "") };
}

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function navigateTo(to: string) {
  const target = to.startsWith("/") ? to : `/${to}`;
  if (window.location.hash === `#${target}`) return;
  window.location.hash = target;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  // Snapshot externe = hash courant (string stable) ; le serveur
  // rend "/" puis React se resynchronise après hydratation.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => ""
  );

  const route = useMemo(() => parseHash(hash), [hash]);
  const navigate = useCallback((to: string) => navigateTo(to), []);

  const value = useMemo(() => ({ ...route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}

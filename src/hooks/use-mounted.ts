"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * true uniquement côté client après hydratation.
 * Pattern recommandé (useSyncExternalStore) pour éviter le
 * setState synchrone dans un effet (règle react-hooks/set-state-in-effect).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

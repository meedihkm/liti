'use client';

/**
 * Hash Router Compatibility Layer
 * Detects old hash routes and redirects to new App Router paths
 */

type HashRoute = {
  pattern: RegExp;
  getNewPath: (match: RegExpMatchArray) => string;
};

const HASH_ROUTES: HashRoute[] = [
  {
    pattern: /^#\/$/,
    getNewPath: () => '/',
  },
  {
    pattern: /^#\/catalog$/,
    getNewPath: () => '/catalogue',
  },
  {
    pattern: /^#\/product\/([^/]+)$/,
    getNewPath: (match) => `/catalogue/${match[1]}`,
  },
  {
    pattern: /^#\/configurator$/,
    getNewPath: () => '/configurateur',
  },
  {
    pattern: /^#\/configurator\/wizard$/,
    getNewPath: () => '/configurateur',
  },
  {
    pattern: /^#\/gallery$/,
    getNewPath: () => '/galerie',
  },
  {
    pattern: /^#\/about$/,
    getNewPath: () => '/a-propos',
  },
  {
    pattern: /^#\/contact$/,
    getNewPath: () => '/contact',
  },
  {
    pattern: /^#\/admin$/,
    getNewPath: () => '/admin',
  },
];

/**
 * Detect and migrate hash routes to App Router
 * Call this on mount in root layout or page
 */
export function detectAndMigrateHashRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash;
  if (!hash) return false;

  for (const route of HASH_ROUTES) {
    const match = hash.match(route.pattern);
    if (match) {
      const newPath = route.getNewPath(match);
      window.history.replaceState({}, '', newPath);
      return true;
    }
  }

  return false;
}

/**
 * Get hash router navigation function for backwards compatibility
 * Returns null if hash router is disabled
 */
export function getHashRouterNav() {
  if (typeof window === 'undefined') return null;

  return {
    push: (path: string) => {
      window.location.hash = path;
    },
    replace: (path: string) => {
      window.location.replace(`#${path}`);
    },
  };
}

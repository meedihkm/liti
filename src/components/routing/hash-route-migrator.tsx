'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hash Route Migrator Component
 * Automatically detects hash routes and migrates to App Router paths
 */

type HashRouteMapping = {
  pattern: RegExp;
  getPath: (match: RegExpMatchArray) => string;
};

const HASH_ROUTE_MAPPINGS: HashRouteMapping[] = [
  {
    pattern: /^#\/$/,
    getPath: () => '/',
  },
  {
    pattern: /^#\/catalog$/,
    getPath: () => '/catalogue',
  },
  {
    pattern: /^#\/product\/([^/]+)$/,
    getPath: (match) => `/catalogue/${match[1]}`,
  },
  {
    pattern: /^#\/configurator(?:\/wizard)?$/,
    getPath: () => '/configurateur',
  },
  {
    pattern: /^#\/gallery$/,
    getPath: () => '/galerie',
  },
  {
    pattern: /^#\/about$/,
    getPath: () => '/a-propos',
  },
  {
    pattern: /^#\/contact$/,
    getPath: () => '/contact',
  },
  {
    pattern: /^#\/admin$/,
    getPath: () => '/admin',
  },
];

export function HashRouteMigrator() {
  const router = useRouter();

  useEffect(() => {
    const checkAndMigrate = () => {
      const hash = window.location.hash;
      if (!hash) return;

      for (const mapping of HASH_ROUTE_MAPPINGS) {
        const match = hash.match(mapping.pattern);
        if (match) {
          const newPath = mapping.getPath(match);
          // Replace current history entry to avoid back button issues
          window.history.replaceState({}, '', newPath);
          router.replace(newPath);
          return;
        }
      }

      // Unknown hash route - clear it and stay on current page
      if (hash.startsWith('#/')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    // Check on mount
    checkAndMigrate();

    // Listen for hash changes
    window.addEventListener('hashchange', checkAndMigrate);

    return () => {
      window.removeEventListener('hashchange', checkAndMigrate);
    };
  }, [router]);

  return null;
}

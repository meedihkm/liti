#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Point d'entrée Docker : prépare la base puis démarre le serveur
# - SQLite (défaut) : schéma appliqué sur le volume /app/data
# - Le seed de démonstration est réalisé par l'AUTO-SEED serveur
#   (src/instrumentation.ts → src/lib/auto-seed.ts) au premier
#   démarrage si la base est vierge et SEED_DEMO ≠ "false".
#   Avantage : il s'exécute dans le serveur standalone où toutes
#   les dépendances (bcryptjs, etc.) sont bundlées par Next.
# ─────────────────────────────────────────────────────────────
set -e

echo "→ Préparation de la base de données…"

# Prisma CLI : node_modules/.bin n'est pas copié dans l'image,
# on appelle le binaire du package directement via npx.
PRISMA="npx prisma"

if echo "$DATABASE_URL" | grep -q "^postgres"; then
  echo "✗ DATABASE_URL pointe vers PostgreSQL mais le schéma Prisma"
  echo "  compilé dans cette image est SQLite." >&2
  echo "  → Voir README.md § « Bascule PostgreSQL » : changer provider"
  echo "    dans prisma/schema.prisma puis reconstruire l'image." >&2
  exit 1
fi

# SQLite : le volume /app/data garantit la persistance.
# db push est idempotent (aucune donnée n'est touchée).
$PRISMA db push --skip-generate --accept-data-loss

echo "→ Démarrage du serveur Next.js…"
echo "   (auto-seed au boot : base vierge + SEED_DEMO≠false → données démo)"
exec node server.js

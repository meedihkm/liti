#!/bin/sh
# ─────────────────────────────────────────────────────────────
# Sauvegarde Taqendurt : base de données + images uploadées
# Usage : ./scripts/backup.sh [dossier_destination] (défaut ./backups)
#
# SQLite  → snapshot cohérent via prisma (VACUUM INTO)
# Postgres → pg_dump (binaire requis sur l'hôte)
# Uploads → archive tar.gz de public/uploads
#
# Planification recommandée (crontab) :
#   0 3 * * * cd /chemin/vers/app && ./scripts/backup.sh >> backups/backup.log 2>&1
# ─────────────────────────────────────────────────────────────
set -e

DEST="${1:-./backups}"
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEST"

echo "── Sauvegarde Taqendurt $(date) ──"

# 1. Base de données
if echo "$DATABASE_URL" | grep -q "^postgres"; then
  echo "→ PostgreSQL : pg_dump…"
  pg_dump "$DATABASE_URL" > "$DEST/db-$STAMP.sql"
elif echo "$DATABASE_URL" | grep -q "^file:"; then
  DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
  echo "→ SQLite : snapshot de $DB_PATH…"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB_PATH" "VACUUM INTO '$DEST/db-$STAMP.sqlite'"
  else
    # Fallback : copie simple (risque mineur si écriture simultanée)
    cp "$DB_PATH" "$DEST/db-$STAMP.sqlite"
  fi
else
  echo "⚠ DATABASE_URL non reconnu — base ignorée"
fi

# 2. Images uploadées
if [ -d public/uploads ]; then
  echo "→ Archive des uploads…"
  tar -czf "$DEST/uploads-$STAMP.tar.gz" -C public uploads
fi

# 3. Rétention : garder les 30 dernières sauvegardes
ls -1t "$DEST"/db-* 2>/dev/null | tail -n +31 | xargs -r rm --
ls -1t "$DEST"/uploads-* 2>/dev/null | tail -n +31 | xargs -r rm --

echo "✓ Sauvegarde terminée : $DEST"
echo "  Restauration SQLite : cp $DEST/db-*.sqlite <chemin>/taqendurt.db"
echo "  Restauration Postgres : psql \$DATABASE_URL < $DEST/db-*.sql"
echo "  Restauration uploads : tar -xzf $DEST/uploads-*.tar.gz -C public"

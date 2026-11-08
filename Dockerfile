# ─────────────────────────────────────────────────────────────
# Taqendurt — image de production Next.js (standalone) + Prisma
# Multi-stage : deps → build → runtime minimal
# ─────────────────────────────────────────────────────────────

FROM oven/bun:1.2-slim AS deps
WORKDIR /app
# Dépendances (avec le lockfile pour la reproductibilité)
COPY package.json bun.lock* ./
RUN bun install --no-save

FROM oven/bun:1.2-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# URL factice : prisma generate ne se connecte pas, il n'a besoin
# que d'une URL syntaxiquement valide au moment du build
ENV DATABASE_URL="file:/tmp/build.db"
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
# Prisma (moteurs natifs) a besoin d'openssl et des certificats ;
# curl est utilisé par le healthcheck de docker-compose.yml.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Serveur standalone Next.js
COPY --from=builder /app/.next/standalone ./
# Fichiers statiques + publics (images du catalogue comprises)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma : schéma + client pour db push / seed au démarrage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
# Sources utiles au seed + helpers (tsconfig pour les alias @/…)
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/i18n ./src/i18n
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

RUN chmod +x scripts/docker-entrypoint.sh \
  && mkdir -p /app/data /app/public/uploads

# Volume : base SQLite + images uploadées (abstraction S3 possible, voir lib/storage.ts)
VOLUME ["/app/data", "/app/public/uploads"]

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

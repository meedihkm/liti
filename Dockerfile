# ─────────────────────────────────────────────────────────────
# Taqendurt — image de production Next.js (standalone) + Prisma
# Version simplifiée pour Coolify
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl curl libc6-compat

# Stage 1: Installation des dépendances
FROM base AS deps
COPY package.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --production=false && \
    npm cache clean --force

# Stage 2: Build de l'application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="file:/tmp/build.db" \
    NODE_ENV=production
RUN npx prisma generate && \
    npm run build

# Stage 3: Runtime
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copier les fichiers nécessaires
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/i18n ./src/i18n
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

RUN chmod +x scripts/docker-entrypoint.sh && \
    mkdir -p /app/data /app/public/uploads && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

VOLUME ["/app/data", "/app/public/uploads"]
EXPOSE 3000

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

# Ashen Armoury — self-hosted deployment image.
# Relies on `output: "standalone"` in next.config.mjs: the build emits a
# minimal server (server.js + pruned node_modules) into .next/standalone.

# --- Stage 1: dependencies -------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Stage 2: build --------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: runtime ------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server first (it owns /app), then static assets + public.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

# syntax=docker/dockerfile:1

# ---- Stage 1: build the client bundle and the server bundle ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only runtime deps. `esbuild --packages=external` leaves every import to be
# resolved from node_modules at runtime, so these must be installed.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# server.ts serves dist/ statically and listens on 3000 (server.ts:9)
EXPOSE 3000

# Drop privileges; the node image ships an unprivileged `node` user.
USER node

CMD ["node", "dist/server.cjs"]

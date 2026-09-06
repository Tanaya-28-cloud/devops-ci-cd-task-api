# ---------- STAGE 1: builder ----------
# This stage has npm and installs dependencies. It never ships to production.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# ---------- STAGE 2: final (production) image ----------
FROM node:20-alpine

WORKDIR /app

# Patch OS-level packages (e.g. openssl) to their latest available fixed versions
RUN apk update && apk upgrade --no-cache

# Copy only the installed dependencies from the builder stage — not npm itself
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src

# Remove npm/npx/corepack from the final image.
# We don't need them at runtime (we only run "node src/index.js"),
# and npm's own bundled internal dependencies are what Trivy was flagging.
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /opt/yarn-v1.22.22 2>/dev/null || true

EXPOSE 3000

USER node

CMD ["node", "src/index.js"]
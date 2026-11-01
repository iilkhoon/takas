# Dəyiş API — produksiya image
FROM node:22-slim
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api...
COPY apps/api apps/api
RUN pnpm --filter api build
WORKDIR /app/apps/api
ENV NODE_ENV=production PORT=4000 UPLOAD_DIR=/data/uploads
EXPOSE 4000
# Miqrasiyaları tətbiq edib serveri başladır
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

# =====================
# 1. Build Stage
# =====================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# =====================
# 2. Production Image
# =====================
FROM node:18-alpine AS runner

WORKDIR /app

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy the actual source directory (src/)
COPY --from=builder /app/src ./src

RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
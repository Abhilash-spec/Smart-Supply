# syntax=docker/dockerfile:1

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack for modern package managers (yarn, pnpm)
RUN corepack enable

# Copy deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy full source
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
# Supabase URL needs to be present during build for nextjs to not throw errors if accessed globally
# But we can let runtime env vars override it.
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output and static files
COPY --from=builder /app/public ./public
# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]

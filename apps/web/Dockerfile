# Construir desde la raíz del monorepo:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://tu-dominio/api -t barapp-web .
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter @barapp/config build && pnpm --filter @barapp/contracts build
RUN pnpm --filter @barapp/web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

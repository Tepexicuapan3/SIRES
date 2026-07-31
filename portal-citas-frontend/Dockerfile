# syntax=docker/dockerfile:1

##########################################
# Build
##########################################

FROM node:22.18-alpine AS build

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@11.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store-portal,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# El portal se sirve desde un dominio separado del backend (ver
# nginx/proxy.conf en la raíz). VITE_API_URL se resuelve en build time y
# queda embebido en el bundle estático, por eso viaja como build arg (mismo
# patrón que frontend/Dockerfile) y no como variable de entorno de runtime.
ARG VITE_API_URL=/api/v1

ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

##########################################
# Nginx
##########################################

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.portal.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]

# syntax=docker/dockerfile:1

##########################################
# Build
##########################################

FROM node:22.18-alpine AS build

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@11.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/api
ARG VITE_APP_NAME=SISEM
ARG VITE_APP_VERSION=1.0.0
ARG VITE_API_TIMEOUT=30000

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT

RUN pnpm run build

##########################################
# Nginx
##########################################

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
# --- Etapa 1: build de estáticos con Vite ---
FROM oven/bun:1.3.8 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ARG VITE_APP_NAME=SISEM
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_APP_NAME=${VITE_APP_NAME}

RUN bun run build

# --- Etapa 2: nginx solo sirviendo los estáticos ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

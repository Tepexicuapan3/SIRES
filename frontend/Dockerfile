FROM oven/bun:1.3.8

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY} \
    HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY}

## Nota
# Vite 7 + React plugin (SWC) corre ok con Bun >= 1.3.x.

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

EXPOSE 5173

# Deps se instalan al arrancar (docker-compose command) para que queden en el volumen /app/node_modules.
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

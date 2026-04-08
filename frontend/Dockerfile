FROM oven/bun:1.3.8

## Nota
# Vite 7 + React plugin (SWC) corre ok con Bun >= 1.3.x.

# Playwright CLI depende de runtime Node para discovery/runner.
RUN apt-get update \
  && apt-get install -y --no-install-recommends nodejs npm \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

EXPOSE 5173

# Deps se instalan al arrancar (docker-compose command) para que queden en el volumen /app/node_modules.
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM python:3.11-slim

# === CONFIGURACIÓN DE PROXY ===
ENV HTTP_PROXY=http://10.15.15.56:3128
ENV HTTPS_PROXY=http://10.15.15.56:3128

# Evitar archivos basura y logs en buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer puerto de Flask
EXPOSE 5000

# Usuario no-root por seguridad
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Comando de inicio
CMD ["python", "run.py"]
FROM python:3.12.1

WORKDIR /app

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ORACLE_INSTANT_CLIENT=/opt/oracle/instantclient \
    LD_LIBRARY_PATH=/opt/oracle/instantclient \
    NLS_LANG=AMERICAN_AMERICA.AL32UTF8
    # ↑ NUEVO: sin NLS_LANG, oracledb en modo Thick puede devolver/comparar
    # cadenas con acentos o timestamps mal interpretados, lo que puede hacer
    # que un UPDATE/MERGE "no encuentre match" silenciosamente si comparas
    # por texto. Ajusta el charset si tu Oracle usa otro distinto a AL32UTF8.

# Dependencias de sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    pkg-config \
    libpq-dev \
    default-libmysqlclient-dev \
    postgresql-client \
    libaio1 \
    unzip \
    curl \
    libreoffice \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------------------------
# Oracle Instant Client
#
# sync_service.py utiliza python-oracledb en modo Thick mediante
# oracledb.init_oracle_client().
#
# Oracle no permite descargar el Instant Client automáticamente sin
# aceptar previamente la licencia.
#
# Descarga manualmente:
# instantclient-basiclite-linux.x64-<version>.zip
#
# desde:
# https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html
#
# y guárdalo como:
# backend/vendor/instantclient-linux.zip
# --------------------------------------------------------------------

COPY vendor/instantclient-linux.zip /tmp/instantclient.zip

RUN unzip -q /tmp/instantclient.zip -d /opt/oracle \
    && mv /opt/oracle/instantclient_* /opt/oracle/instantclient \
    && rm /tmp/instantclient.zip \
    && echo "/opt/oracle/instantclient" > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

# Instalar dependencias de Python
COPY requirements.txt .

# pywin32 sólo funciona en Windows (automatización COM).
# En Linux la conversión DOCX -> PDF debe realizarse mediante
# LibreOffice en modo headless.
RUN sed -i '/^pywin32==/d' requirements.txt \
    && pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Usuario no privilegiado
RUN useradd --create-home --shell /bin/sh appuser \
    && chown -R appuser:appuser /app

USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

CMD ["sh", "/app/start-docker.sh"]
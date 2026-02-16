FROM python:3.12-slim

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

ENV http_proxy=${HTTP_PROXY} \
    https_proxy=${HTTPS_PROXY} \
    no_proxy=${NO_PROXY} \
    HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY}

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Dependencias del sistema para compilar mysqlclient
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt

# requirements.txt esta en UTF-16 en este repo; pip espera UTF-8.
RUN python -c "import pathlib; p=pathlib.Path('requirements.txt'); t=p.read_text(encoding='utf-16', errors='strict'); pathlib.Path('requirements.utf8.txt').write_text(t, encoding='utf-8')" \
  && pip install --no-cache-dir -r requirements.utf8.txt \
  && pip install --no-cache-dir mysqlclient \
  && pip install --no-cache-dir django-cors-headers

COPY . .

EXPOSE 5000

CMD ["python", "manage.py", "runserver", "0.0.0.0:5000"]

@echo off
setlocal
cd /d "%~dp0"

if not exist venv\Scripts\activate.bat (
    echo No se encontro backend\venv - crea el entorno virtual primero.
    exit /b 1
)

echo Iniciando worker de Celery en una ventana nueva (--pool=solo, requerido en Windows)...
start "SISEM - Celery Worker" cmd /k "call venv\Scripts\activate.bat && celery -A config worker -l info --pool=solo"

echo Iniciando el backend (runserver) en esta ventana...
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:5000

# KAN-19 - Backend Gate Reproducible

## Objetivo

Definir una corrida backend estable y repetible para evidenciar contrato API, maquina de estados y realtime antes de cierre de `KAN-19`.

## Suite recomendada

```bash
python manage.py test \
  apps.recepcion.tests \
  apps.somatometria.tests \
  apps.consulta_medica.tests \
  apps.realtime.tests
```

## Criterios de aprobacion

- Todas las suites anteriores en verde.
- Sin warnings de modelos con cambios sin migrar.
- Evidencia de casos borde:
  - `cancelada`
  - `no_show`
  - `VISIT_STATE_INVALID`
  - `ROLE_NOT_ALLOWED`
  - `PERMISSION_DENIED` por CSRF
- Evidencia de realtime:
  - handshake seguro por cookie JWT
  - rechazo de origen/token en query
  - secuencia monotona por stream
  - eventos `visit.created`, `visit.status.changed`, `visit.closed`

## Formato minimo de evidencia

Adjuntar en Jira:

1. Comando ejecutado.
2. Resumen de salida (`Ran X tests` + `OK`).
3. Hash/commit evaluado.
4. Fecha/hora de corrida.

Plantilla:

```text
KAN-19 backend gate

Commit: <hash>
Fecha: <YYYY-MM-DD HH:mm TZ>
Comando: python manage.py test apps.recepcion.tests apps.somatometria.tests apps.consulta_medica.tests apps.realtime.tests
Resultado: Ran <N> tests ... OK
Notas: <incidencias o "sin incidencias">
```

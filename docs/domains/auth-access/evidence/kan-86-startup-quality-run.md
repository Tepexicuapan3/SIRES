# KAN-86 Startup Log Extract

```text
sires-auth-db  |
sires-backend  | Operations to perform:
sires-auth-db  | PostgreSQL Database directory appears to contain a database; Skipping initialization
sires-auth-db  |
sires-backend  |   Apply all migrations: admin, administracion, auth, authentication, catalogos, consulta_medica, contenttypes, realtime, recepcion, sessions, somatometria
sires-auth-db  | 2026-04-10 17:50:20.933 UTC [1] LOG:  starting PostgreSQL 16.13 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
sires-backend  | Running migrations:
sires-backend  |   No migrations to apply.
sires-backend  | 2026-04-10 11:50:41,183 INFO     Starting server at tcp:port=5000:interface=0.0.0.0
sires-backend  | 2026-04-10 11:50:41,183 INFO     HTTP/2 support not enabled (install the http2 and tls Twisted extras)
sires-auth-db  | 2026-04-10 17:50:20.933 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
sires-backend  | 2026-04-10 11:50:41,183 INFO     Configuring endpoint tcp:port=5000:interface=0.0.0.0
sires-backend  | 2026-04-10 11:50:41,185 INFO     Listening on TCP address 0.0.0.0:5000
sires-auth-db  | 2026-04-10 17:50:20.933 UTC [1] LOG:  listening on IPv6 address "::", port 5432
sires-auth-db  | 2026-04-10 17:50:20.938 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
sires-auth-db  | 2026-04-10 17:50:20.946 UTC [29] LOG:  database system was shut down at 2026-04-10 17:47:18 UTC
sires-auth-db  | 2026-04-10 17:50:20.955 UTC [1] LOG:  database system is ready to accept connections
```

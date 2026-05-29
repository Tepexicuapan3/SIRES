import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection
c = connection.cursor()

print("=== Columnas de sires.rcp_visits ===")
c.execute("""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'sires' AND table_name = 'rcp_visits'
    ORDER BY ordinal_position
""")
for row in c.fetchall():
    print(f"  {row[0]:<25} {row[1]:<30} nullable={row[2]}")

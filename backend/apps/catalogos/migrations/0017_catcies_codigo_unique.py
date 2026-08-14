# cat_cies.codigo (mapeado como CatCies.code, primary_key=True en el modelo
# Django) nunca tuvo una constraint UNIQUE/PK real en Postgres -- la PK
# fisica de la tabla vive en una columna "id_cie" que el modelo Django no
# conoce ni mapea (drift heredado de la migracion desde el sistema legado,
# igual que otros catalogos reconciliados en 0013/0014/0015). Sin un UNIQUE
# real sobre "codigo", ninguna FK puede apuntarle (Postgres lo rechaza:
# "no hay restriccion unique que coincida con las columnas dadas").
#
# Se verifico antes de escribir esto: 59 filas, 59 valores "codigo"
# distintos -- cero duplicados, agregar el UNIQUE es seguro con los datos
# actuales. No se toca "id_cie" (fuera de alcance): esto solo habilita que
# consulta_medica.VisitConsultation.cie referencie CatCies con integridad
# real.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalogos", "0016_autorizadores_fk_integrity"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="catcies",
            constraint=models.UniqueConstraint(fields=["code"], name="cat_cies_codigo_uniq"),
        ),
    ]

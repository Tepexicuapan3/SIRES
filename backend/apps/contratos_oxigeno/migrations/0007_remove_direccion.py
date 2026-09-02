# direccion quedaba duplicado con el domicilio desglosado (calle, num_ext,
# colonia, alcaldia, cp, etc.) agregado para formato_oxigeno.docx -- ese
# desglose ya cubre toda la informacion que direccion guardaba como texto libre.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("contratos_oxigeno", "0006_especialidad_fk_integrity"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contratooxigeno",
            name="direccion",
        ),
    ]

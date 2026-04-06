from django.shortcuts import render
from .models import Receta


def ver_receta(request, id):

    receta = Receta.objects.get(id=id)

    return render(request, "recetas/receta_sisem.html", {
        "receta": receta
    })

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.administracion.urls')),
    path('api/v1/', include('apps.catalogos.urls')),
    path('api/v1/', include('apps.authentication.urls')),
    path('api/v1/', include('apps.recepcion.urls')),
    path('api/v1/', include('apps.somatometria.urls')),
    path('api/v1/', include('apps.consulta_medica.urls')),
    path('api/v1/', include('apps.farmacia.urls')),
    #path('recetas/', include('apps.recetas.urls')),
]

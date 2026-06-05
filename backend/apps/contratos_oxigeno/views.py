import math
from datetime import date, timedelta

from django.db.models import Count
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import ContratoOxigeno
from .serializers import ContratoOxigenoSerializer


# ── Paginación estándar ── formato {items, page, pageSize, total, totalPages} ─

class StandardListPagination(PageNumberPagination):
    page_size              = 20
    page_size_query_param  = "pageSize"
    max_page_size          = 200
    page_query_param       = "page"

    def get_paginated_response(self, data):
        page_size   = self.get_page_size(self.request) or self.page_size
        total       = self.page.paginator.count
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return Response({
            "items":      data,
            "page":       self.page.number,
            "pageSize":   page_size,
            "total":      total,
            "totalPages": total_pages,
        })


# ── ViewSet ───────────────────────────────────────────────────────────────────

class ContratoOxigenoViewSet(viewsets.ModelViewSet):
    serializer_class = ContratoOxigenoSerializer
    pagination_class = StandardListPagination
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["nombre", "num_contrato", "expediente", "diagnostico"]
    ordering_fields  = [
        "num_contrato", "nombre", "fecha_renovar",
        "dias_faltan", "status", "sucursal", "clinica",
    ]
    ordering = ["num_contrato"]

    def get_queryset(self):
        qs     = ContratoOxigeno.objects.all()
        params = self.request.query_params

        if sucursal := params.get("sucursal"):
            qs = qs.filter(sucursal__iexact=sucursal)

        if status_val := params.get("status"):
            qs = qs.filter(status=status_val)

        if tp_der := params.get("tpDer"):
            qs = qs.filter(tp_der=tp_der)

        if clinica := params.get("clinica"):
            qs = qs.filter(clinica__icontains=clinica)

        return qs

    # ── GET /contratos-oxigeno/estadisticas/ ──────────────────────────────────

    @action(detail=False, methods=["get"], url_path="estadisticas")
    def estadisticas(self, request):
        qs      = ContratoOxigeno.objects.all()
        today   = date.today()
        prox_30 = today + timedelta(days=30)

        por_status   = {
            item["status"]: item["total"]
            for item in qs.values("status").annotate(total=Count("id"))
        }
        por_sucursal = {
            item["sucursal"]: item["total"]
            for item in qs.values("sucursal").annotate(total=Count("id"))
        }

        return Response({
            "total":          qs.count(),
            "vigentes":       por_status.get("VIGENTE",    0),
            "porVencer":      por_status.get("POR_VENCER", 0),
            "vencidos":       por_status.get("VENCIDO",    0),
            "porStatus":      por_status,
            "porSucursal":    por_sucursal,
            "porVencer30Dias": qs.filter(
                fecha_renovar__gte=today,
                fecha_renovar__lte=prox_30,
            ).count(),
        })

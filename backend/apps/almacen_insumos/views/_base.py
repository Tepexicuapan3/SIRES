import math

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardListPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = "pageSize"
    max_page_size         = 200
    page_query_param      = "page"

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

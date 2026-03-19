import re

from django.db.models import Q, Value
from django.db.models.functions import Replace, Upper

from apps.catalogos.models import CatCies


class CiesRepository:
    @staticmethod
    def get_active_by_code(code):
        return CatCies.objects.filter(code=code, is_active=True).first()

    @staticmethod
    def search_active(search, *, limit=10):
        normalized_search = (search or "").strip()
        if not normalized_search:
            return []

        normalized_code_search = re.sub(r"[^A-Za-z0-9]", "", normalized_search)

        normalized_code_expression = Upper(
            Replace(
                Replace(
                    Replace(
                        Replace("code", Value("."), Value("")),
                        Value("-"),
                        Value(""),
                    ),
                    Value("/"),
                    Value(""),
                ),
                Value(" "),
                Value(""),
            )
        )

        queryset = CatCies.objects.filter(is_active=True).annotate(
            normalized_code=normalized_code_expression
        )

        if normalized_code_search:
            queryset = queryset.filter(
                Q(code__icontains=normalized_search)
                | Q(description__icontains=normalized_search)
                | Q(normalized_code__icontains=normalized_code_search.upper())
            )
        else:
            queryset = queryset.filter(
                Q(code__icontains=normalized_search)
                | Q(description__icontains=normalized_search)
            )

        queryset = queryset.order_by("code")

        return list(queryset[:limit])

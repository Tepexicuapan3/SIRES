from rest_framework.views import APIView
from rest_framework.response import Response
from ..use_cases.roles.create_role import CreateRoleUseCase
from ..serializers.role_serializers import RoleDetailSerializer


class RoleCreateView(APIView):

    def post(self, request):

        role = CreateRoleUseCase.execute(request, request.data)
        serializer = RoleDetailSerializer(role)

        return Response(serializer.data, status=201)

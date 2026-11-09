from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

from .serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []


class MeView(generics.RetrieveUpdateAPIView):
    """The logged-in player's own profile."""

    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile
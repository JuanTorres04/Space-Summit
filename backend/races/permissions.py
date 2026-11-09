from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    """Any logged-in user can read. Only staff can create, edit, or delete."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff


class IsHost(BasePermission):
    """Only the race's host can act on it."""

    def has_object_permission(self, request, view, obj):
        return obj.host_id == request.user.id
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeaderboardView, PassageViewSet, RaceViewSet, TrackViewSet

router = DefaultRouter()
router.register("tracks", TrackViewSet, basename="track")
router.register("passages", PassageViewSet, basename="passage")
router.register("races", RaceViewSet, basename="race")

urlpatterns = [
    path("", include(router.urls)),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]

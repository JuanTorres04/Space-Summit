from django.db import transaction
from django.utils import timezone
from accounts.models import Profile
from .scoring import SuspiciousSubmission, score_submission
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from .models import Passage, Race, RaceParticipant, Track
from .permissions import IsAdminOrReadOnly, IsHost
from .serializers import (
    LeaderboardEntrySerializer,
    PassageSerializer,
    RaceSerializer,
    TrackSerializer,
    SubmitResultSerializer,
)


class TrackViewSet(viewsets.ModelViewSet):
    serializer_class = TrackSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "elevation_m"]
    ordering = ["elevation_m"]

    def get_queryset(self):
        # annotate() counts passages in the same query, so no per-track extra queries
        qs = Track.objects.annotate(passage_count=Count("passages"))
        difficulty = self.request.query_params.get("difficulty")
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        return qs


class PassageViewSet(viewsets.ModelViewSet):
    serializer_class = PassageSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["text", "source"]
    ordering_fields = ["word_count", "created_at"]

    def get_queryset(self):
        # select_related joins the track, prefetch_related loads all tags in one query
        qs = Passage.objects.select_related("track").prefetch_related("tags")
        track = self.request.query_params.get("track")
        tag = self.request.query_params.get("tag")
        if track:
            qs = qs.filter(track_id=track)
        if tag:
            qs = qs.filter(tags__name=tag)
        return qs


class RaceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = RaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        participants = RaceParticipant.objects.select_related("user").order_by(
            "finish_position", "joined_at"
        )
        return Race.objects.select_related("host", "track").prefetch_related(
            Prefetch("participants", queryset=participants)
        )

    def get_permissions(self):
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsHost()]
        return super().get_permissions()

    def perform_create(self, serializer):
        # Create the race and the host's participant row together, or not at all
        with transaction.atomic():
            race = serializer.save(host=self.request.user)
            RaceParticipant.objects.create(race=race, user=self.request.user)

    def perform_destroy(self, instance):
        if instance.status != Race.Status.WAITING:
            raise ValidationError({"detail": "Only races that haven't started can be cancelled."})
        instance.delete()

    @action(detail=False, methods=["post"])
    def join(self, request):
        code = str(request.data.get("room_code", "")).strip().upper()
        race = get_object_or_404(Race, room_code=code)
        if race.status != Race.Status.WAITING:
            raise ValidationError({"detail": "This race has already started."})
        RaceParticipant.objects.get_or_create(race=race, user=request.user)
        race = self.get_queryset().get(pk=race.pk)
        return Response(self.get_serializer(race).data)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        serializer = SubmitResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # All-or-nothing: score, participant row, profile stats, and race status
        with transaction.atomic():
            race = get_object_or_404(
                Race.objects.select_for_update().select_related("passage"), pk=pk
            )
            participant = get_object_or_404(
                RaceParticipant.objects.select_for_update(), race=race, user=request.user
            )
            if participant.finished_at:
                raise ValidationError({"detail": "You already submitted a result for this race."})

            try:
                scores = score_submission(
                    serializer.validated_data["typed"],
                    race.passage.text,
                    serializer.validated_data["elapsed_seconds"],
                )
            except SuspiciousSubmission as exc:
                raise ValidationError({"detail": str(exc)})

            now = timezone.now()
            participant.wpm = scores["wpm"]
            participant.accuracy = scores["accuracy"]
            participant.finish_position = (
                race.participants.filter(finished_at__isnull=False).count() + 1
            )
            participant.finished_at = now
            participant.save()

            profile = Profile.objects.select_for_update().get(user=request.user)
            n = profile.races_completed
            profile.avg_accuracy = round(
                (profile.avg_accuracy * n + scores["accuracy"]) / (n + 1), 1
            )
            profile.best_wpm = max(profile.best_wpm, scores["wpm"])
            profile.races_completed = n + 1
            profile.save()

            if not race.participants.filter(finished_at__isnull=True).exists():
                race.status = Race.Status.FINISHED
                race.finished_at = now
                race.save()

        return Response(
            {**scores, "finish_position": participant.finish_position},
            status=200,
        )

class LeaderboardView(ListAPIView):
    serializer_class = LeaderboardEntrySerializer

    def get_queryset(self):
        qs = (
            RaceParticipant.objects.select_related("user", "race__track")
            .filter(wpm__isnull=False)
            .order_by("-wpm")
        )
        track = self.request.query_params.get("track")
        if track:
            qs = qs.filter(race__track_id=track)
        return qs
from rest_framework import serializers

from .models import Passage, PassageTag, Race, RaceParticipant, Track


class TrackSerializer(serializers.ModelSerializer):
    passage_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Track
        fields = (
            "id",
            "name",
            "description",
            "elevation_m",
            "difficulty",
            "passage_count",
        )


class PassageSerializer(serializers.ModelSerializer):
    track_name = serializers.CharField(source="track.name", read_only=True)
    track_elevation_m = serializers.IntegerField(
        source="track.elevation_m", read_only=True
    )
    tags = serializers.SlugRelatedField(
        many=True,
        slug_field="name",
        queryset=PassageTag.objects.all(),
        required=False,
    )

    class Meta:
        model = Passage
        fields = (
            "id",
            "track",
            "track_name",
            "track_elevation_m",
            "text",
            "source",
            "word_count",
            "tags",
        )
        read_only_fields = ("word_count",)


class RaceParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = RaceParticipant
        fields = ("username", "wpm", "accuracy", "finish_position", "finished_at")


class RaceSerializer(serializers.ModelSerializer):
    host_username = serializers.CharField(source="host.username", read_only=True)
    track_name = serializers.CharField(source="track.name", read_only=True)
    participants = RaceParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Race
        fields = (
            "id",
            "room_code",
            "host_username",
            "track",
            "track_name",
            "passage",
            "status",
            "participants",
            "created_at",
            "started_at",
            "finished_at",
        )
        read_only_fields = ("room_code", "status", "started_at", "finished_at")

    def validate(self, attrs):
        if attrs["passage"].track_id != attrs["track"].id:
            raise serializers.ValidationError(
                "That passage does not belong to the selected track."
            )
        return attrs


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    track_name = serializers.CharField(source="race.track.name", read_only=True)

    class Meta:
        model = RaceParticipant
        fields = ("username", "track_name", "wpm", "accuracy", "finished_at")


class SubmitResultSerializer(serializers.Serializer):
    typed = serializers.CharField(max_length=5000, trim_whitespace=False)
    elapsed_seconds = serializers.FloatField(min_value=0.1)
    mistakes = serializers.IntegerField(
        min_value=0, max_value=2000, required=False, default=0
    )

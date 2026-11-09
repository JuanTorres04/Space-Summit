import secrets

from django.conf import settings
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models


class PassageTag(models.Model):
    name = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return self.name


class Track(models.Model):
    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MODERATE = "moderate", "Moderate"
        HARD = "hard", "Hard"

    name = models.CharField(max_length=80, unique=True)
    description = models.TextField(blank=True)
    elevation_m = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.EASY
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Passage(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="passages")
    text = models.TextField(validators=[MinLengthValidator(50)])
    source = models.CharField(max_length=120, blank=True)
    word_count = models.PositiveIntegerField(editable=False, default=0)
    tags = models.ManyToManyField(PassageTag, related_name="passages", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.word_count = len(self.text.split())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.track.name}: {self.text[:40]}..."


ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no confusing 0/O, 1/I

def generate_room_code():
    while True:
        code = "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(6))
        if not Race.objects.filter(room_code=code).exists():
            return code


class Race(models.Model):
    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting"
        IN_PROGRESS = "in_progress", "In progress"
        FINISHED = "finished", "Finished"

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hosted_races"
    )
    track = models.ForeignKey(Track, on_delete=models.PROTECT, related_name="races")
    passage = models.ForeignKey(Passage, on_delete=models.PROTECT, related_name="races")
    room_code = models.CharField(max_length=6, unique=True, editable=False)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.WAITING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.room_code:
            self.room_code = generate_room_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Race {self.room_code} on {self.track.name}"


class RaceParticipant(models.Model):
    race = models.ForeignKey(Race, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="race_entries"
    )
    wpm = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0)])
    accuracy = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    finish_position = models.PositiveIntegerField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["race", "user"], name="unique_user_per_race"
            )
        ]

    def __str__(self):
        return f"{self.user} in {self.race.room_code}"
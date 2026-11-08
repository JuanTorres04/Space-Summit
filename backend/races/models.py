from django.core.validators import MinLengthValidator, MinValueValidator
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
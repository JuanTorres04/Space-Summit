from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models


class Profile(models.Model):
    AVATAR_CHOICES = [
        ("rover", "Rover"),
        ("astronaut", "Astronaut"),
        ("comet", "Comet"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=30, blank=True)
    avatar = models.CharField(max_length=20, choices=AVATAR_CHOICES, default="astronaut")
    best_wpm = models.FloatField(default=0)
    avg_accuracy = models.FloatField(default=0, validators=[MaxValueValidator(100)])
    races_completed = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name or self.user.username
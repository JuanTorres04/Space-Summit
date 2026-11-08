from django.core.management.base import BaseCommand

from races.models import Passage, PassageTag, Track

TRACKS = [
    {
        "name": "Lunar Ridge",
        "description": "A gentle warm-up trail across the Moon's dusty highlands.",
        "elevation_m": 1500,
        "difficulty": "easy",
        "passages": [
            {
                "text": "The Moon has no atmosphere, so there is no wind or rain to smooth away the "
                "footprints left by astronauts. Each step kicks up fine gray dust that settles "
                "back down and stays exactly where it fell.",
                "source": "Space facts",
                "tags": ["astronomy"],
            },
            {
                "text": "Every long hike begins with a single steady step. Keep your breathing calm, "
                "watch the trail ahead, and let your rhythm carry you upward one stride at a "
                "time, just like typing.",
                "source": "Trail wisdom",
                "tags": ["hiking"],
            },
        ],
    },
    {
        "name": "Belt Scramble",
        "description": "A rocky route weaving between drifting asteroids.",
        "elevation_m": 4000,
        "difficulty": "moderate",
        "passages": [
            {
                "text": "Despite what movies show, the asteroid belt is mostly empty space. Thousands "
                "of rocks drift between Mars and Jupiter, but they are spread so far apart that "
                "spacecraft can pass through without coming close to one.",
                "source": "Space facts",
                "tags": ["astronomy"],
            },
        ],
    },
    {
        "name": "Olympus Mons Summit",
        "description": "The ultimate climb up the tallest volcano in the solar system.",
        "elevation_m": 22000,
        "difficulty": "hard",
        "passages": [
            {
                "text": "Olympus Mons on Mars rises about twenty-two kilometers above the surrounding "
                "plains, nearly three times the height of Mount Everest. Its base is roughly "
                "six hundred kilometers wide, so the slopes are surprisingly gentle.",
                "source": "Space facts",
                "tags": ["astronomy", "hiking"],
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed tracks, passages, and tags"

    def handle(self, *args, **options):
        for data in TRACKS:
            track, _ = Track.objects.update_or_create(
                name=data["name"],
                defaults={
                    "description": data["description"],
                    "elevation_m": data["elevation_m"],
                    "difficulty": data["difficulty"],
                },
            )
            for p in data["passages"]:
                passage, _ = Passage.objects.get_or_create(
                    track=track, text=p["text"], defaults={"source": p["source"]}
                )
                for tag_name in p["tags"]:
                    tag, _ = PassageTag.objects.get_or_create(name=tag_name)
                    passage.tags.add(tag)
        self.stdout.write(self.style.SUCCESS("Seeded tracks and passages"))
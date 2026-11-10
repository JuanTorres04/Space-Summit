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
                "tags": ["astronomy", "moon"],
            },
            {
                "text": "Every long hike begins with a single steady step. Keep your breathing calm, "
                "watch the trail ahead, and let your rhythm carry you upward one stride at a "
                "time, just like typing.",
                "source": "Trail wisdom",
                "tags": ["hiking"],
            },
            {
                "text": "A full day on the Moon lasts about twenty-nine Earth days, so the sun crawls "
                "across the sky far more slowly than it does at home. Temperatures swing from "
                "scorching heat in sunlight to bitter cold in shadow.",
                "source": "Space facts",
                "tags": ["astronomy", "moon"],
            },
            {
                "text": "The Moon's gravity is only about one sixth of Earth's gravity, so a hiker "
                "carrying a heavy backpack would feel surprisingly light. Every step carries you "
                "farther, and every jump floats higher than you expect.",
                "source": "Space facts",
                "tags": ["astronomy", "hiking", "moon"],
            },
            {
                "text": "The Apollo astronauts left boot prints, flags, and scientific instruments on "
                "the lunar surface. With no weather to erase them, some of those marks may last "
                "for millions of years.",
                "source": "Space history",
                "tags": ["history", "moon"],
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
                "tags": ["astronomy", "asteroids"],
            },
            {
                "text": "Ceres is the largest object in the asteroid belt and is classed as a dwarf "
                "planet. Bright white patches on its surface turned out to be salt deposits left "
                "behind when salty water leaked out and evaporated.",
                "source": "Space facts",
                "tags": ["astronomy", "asteroids"],
            },
            {
                "text": "Most asteroids are leftover building blocks from the early solar system, rocks "
                "that never grew into a planet because the gravity of giant Jupiter kept stirring "
                "them up. Hiking across one means walking on material that is over four billion "
                "years old.",
                "source": "Space facts",
                "tags": ["astronomy", "asteroids", "hiking"],
            },
            {
                "text": "Small asteroids have so little gravity that a hard jump could send you drifting "
                "off into space. A careful hiker would move slowly and clip a safety tether to the "
                "ground every few steps.",
                "source": "Trail wisdom",
                "tags": ["asteroids", "hiking"],
            },
            {
                "text": "The Dawn spacecraft became the first mission to orbit two different worlds "
                "beyond Earth, spending time at the giant asteroid Vesta and then at the dwarf "
                "planet Ceres.",
                "source": "Space history",
                "tags": ["history", "asteroids"],
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
                "tags": ["astronomy", "hiking", "mars"],
            },
            {
                "text": "Mars has a thin atmosphere made mostly of carbon dioxide, so a hiker there needs "
                "a pressurized suit and a steady supply of oxygen. The daytime sky glows a dusty "
                "butterscotch color, while sunsets shine a cool blue.",
                "source": "Space facts",
                "tags": ["astronomy", "mars"],
            },
            {
                "text": "The cliffs around the edge of Olympus Mons tower about six kilometers high, "
                "taller than many of the great mountains on Earth. A hiker would have to search "
                "for a gentle route up the slopes because the cliffs are far too steep to climb.",
                "source": "Space facts",
                "tags": ["mars", "hiking"],
            },
            {
                "text": "Olympus Mons is a shield volcano, built up from countless layers of runny lava "
                "that flowed out over millions of years. Its slopes rise so gently that a hiker "
                "might never realize they were climbing the biggest volcano known in the solar "
                "system.",
                "source": "Space facts",
                "tags": ["astronomy", "mars"],
            },
            {
                "text": "The air near the summit of Olympus Mons is thinner than the already thin air "
                "elsewhere on Mars, because the volcano rises above most of the atmosphere. A "
                "hiker would depend entirely on a sealed suit for every breath.",
                "source": "Space facts",
                "tags": ["mars", "hiking"],
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

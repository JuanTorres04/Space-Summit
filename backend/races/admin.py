from django.contrib import admin

from .models import Passage, PassageTag, Race, RaceParticipant, Track


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ("name", "difficulty", "elevation_m")
    list_filter = ("difficulty",)


@admin.register(Passage)
class PassageAdmin(admin.ModelAdmin):
    list_display = ("track", "word_count", "source")
    list_filter = ("track", "tags")
    filter_horizontal = ("tags",)


class RaceParticipantInline(admin.TabularInline):
    model = RaceParticipant
    extra = 0


@admin.register(Race)
class RaceAdmin(admin.ModelAdmin):
    list_display = ("room_code", "track", "host", "status", "created_at")
    list_filter = ("status", "track")
    readonly_fields = ("room_code",)
    inlines = [RaceParticipantInline]


admin.site.register(PassageTag)
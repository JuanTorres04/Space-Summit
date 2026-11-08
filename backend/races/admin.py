from django.contrib import admin

from .models import Passage, PassageTag, Track


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ("name", "difficulty", "elevation_m")
    list_filter = ("difficulty",)


@admin.register(Passage)
class PassageAdmin(admin.ModelAdmin):
    list_display = ("track", "word_count", "source")
    list_filter = ("track", "tags")
    filter_horizontal = ("tags",)


admin.site.register(PassageTag)
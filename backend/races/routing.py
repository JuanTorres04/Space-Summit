from django.urls import re_path

from .consumers import RaceConsumer

websocket_urlpatterns = [
    re_path(r"^ws/races/(?P<room_code>[A-Z0-9]{6})/$", RaceConsumer.as_asgi()),
]

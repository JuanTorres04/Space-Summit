from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .models import Race, RaceParticipant

class RaceConsumer(AsyncJsonWebsocketConsumer):
    """Live lobby and progress sharing for one race room."""

    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.group = f"race_{self.room_code}"
        self.user = self.scope["user"]
        self.started = False
        self.passage_len = 0

        if not self.user.is_authenticated:
            await self.close(code=4401)
            return

        race = await self.load_race()
        if race is None:
            await self.close(code=4404)
            return
        self.race_id = race["id"]
        self.passage_len = race["passage_len"]
        self.started = race["status"] == Race.Status.IN_PROGRESS

        if not await self.ensure_participant():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.broadcast_state()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict):
            return
        kind = content.get("type")
        if kind == "start":
            if await self.start_race():
                await self.channel_layer.group_send(
                    self.group, {"type": "race.started"}
                )
        elif kind == "progress":
            position = content.get("position")
            if (
                not self.started
                or not isinstance(position, int)
                or isinstance(position, bool)
            ):
                return
            position = max(0, min(position, self.passage_len))
            await self.channel_layer.group_send(
                self.group,
                {
                    "type": "race.progress",
                    "username": self.user.username,
                    "position": position,
                },
            )

    async def broadcast_state(self):
        state = await self.lobby_snapshot()
        await self.channel_layer.group_send(
            self.group, {"type": "race.state", "state": state}
        )

    # --- handlers for messages sent to the whole room ---

    async def race_state(self, event):
        await self.send_json({"type": "state", **event["state"]})

    async def race_started(self, event):
        self.started = True
        await self.send_json({"type": "started"})

    async def race_progress(self, event):
        total = self.passage_len or 1
        await self.send_json(
            {
                "type": "progress",
                "username": event["username"],
                "progress": round(event["position"] / total * 100, 1),
            }
        )

    async def race_finished(self, event):
        await self.send_json(
            {
                "type": "finished",
                "username": event["username"],
                "wpm": event["wpm"],
                "accuracy": event["accuracy"],
                "position": event["position"],
            }
        )

    # --- database access ---

    @database_sync_to_async
    def load_race(self):
        race = (
            Race.objects.select_related("passage")
            .filter(room_code=self.room_code)
            .first()
        )
        if race is None:
            return None
        return {
            "id": race.id,
            "status": race.status,
            "passage_len": len(race.passage.text),
        }

    @database_sync_to_async
    def ensure_participant(self):
        race = Race.objects.get(pk=self.race_id)
        if race.status == Race.Status.WAITING:
            RaceParticipant.objects.get_or_create(race=race, user=self.user)
            return True
        return RaceParticipant.objects.filter(race=race, user=self.user).exists()

    @database_sync_to_async
    def start_race(self):
        updated = Race.objects.filter(
            pk=self.race_id, host_id=self.user.id, status=Race.Status.WAITING
        ).update(status=Race.Status.IN_PROGRESS, started_at=timezone.now())
        return updated == 1

    @database_sync_to_async
    def lobby_snapshot(self):
        race = Race.objects.select_related("host").get(pk=self.race_id)
        players = list(
            race.participants.order_by("joined_at").values_list(
                "user__username", flat=True
            )
        )
        return {"status": race.status, "host": race.host.username, "players": players}
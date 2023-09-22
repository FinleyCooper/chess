import datetime
import json

class Table:
    def __init__(self, _id: str):
        self._id = _id

    def to_dict(self):
        raise "to_dict method not implemented on subclass"

class User(Table):
    def __init__(self, _id: str, email: str, password_hash: str, auth_level: int, name: str, level_id: str = None):
        super().__init__(_id)
        self.email = email
        self.password_hash = password_hash
        self.auth_level = auth_level
        self.name = name
        self.level_id = level_id

    def to_dict(self, inclucde_sensitive: bool = False):
        dictionary = {
            "id": self._id,
            "email": self.email,
            "auth_level": self.auth_level,
            "name": self.name,
            "level_id": self.level_id,
        }

        if inclucde_sensitive:
            dictionary["password_hash"] = self.password_hash

        return dictionary


class Link(Table):
    def __init__(self, _id: str, link_suffix: str, created_at: str, expires_at: str, game_id: str):
        super().__init__(_id)
        self.linkURL = link_suffix
        self.created_at = created_at
        self.expires_at = expires_at
        self.game_id = game_id

    def isExpired(self):
        expires_at_timestamp = datetime.datetime.strptime(self.expires_at, "%Y-%m-%d %H:%M:%S")

        return expires_at_timestamp.timestamp() < datetime.datetime.now(datetime.timezone.utc).timestamp()


class Game(Table):
    def __init__(
        self,
        _id: str,
        move_list: str,
        game_result: str,
        date_played: str,
        custom_settings: str,
        human_plays_as: int,
        winner: int,
        user_id: str,
        campaign_id: str | None = None,
        level_id: str | None = None,
    ):
        super().__init__(_id)
        self.move_list = move_list
        self.game_result = game_result
        self.date_played = date_played
        self.custom_settings = custom_settings
        self.human_plays_as = human_plays_as
        self.winner = winner
        self.user_id = user_id
        self.campaign_id = str(campaign_id) if campaign_id is not None else None
        self.level_id = str(level_id) if level_id is not None else None

    def to_dict(self):
        return {
            "id": self._id,
            "move_list": self.move_list,
            "game_result": self.game_result,
            "date_played": self.date_played,
            "custom_settings": self.custom_settings,
            "human_plays_as": self.human_plays_as,
            "winner": self.winner,
            "user_id": self.user_id,
            "campaign_id": self.campaign_id,
            "level_id": self.level_id,
        }


class CampaignLevel(Table):
    text: list[str]
    battle_settings: dict | None

    def __init__(self, _id: str, text: str, battle_settings: str):
        super().__init__(_id)
        self.text = json.loads(text)
        self.battle_settings = json.loads(battle_settings) if battle_settings is not None else None

    def to_dict(self):
        return {"id": self._id, "text": self.text, "battle_settings": self.battle_settings}

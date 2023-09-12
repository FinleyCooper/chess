import sqlite3
import datetime


class User:
    def __init__(self, _id: str, email: str, password_hash: str, auth_level: int, name: str):
        self._id = _id
        self.email = email
        self.password_hash = password_hash
        self.auth_level = auth_level
        self.name = name

    def to_dict(self, inclucde_sensitive: bool = False):
        dictionary = {"id": self._id, "email": self.email, "auth_level": self.auth_level, "name": self.name}

        if inclucde_sensitive:
            dictionary["password_hash"] = self.password_hash

        return dictionary


class Link:
    def __init__(self, _id: str, link_suffix: str, created_at: str, expires_at: str, game_id: str):
        self._id = _id
        self.linkURL = link_suffix
        self.created_at = created_at
        self.expires_at = expires_at
        self.game_id = game_id

    def isExpired(self):
        expires_at_timestamp = datetime.datetime.strptime(self.expires_at, "%Y-%m-%d %H:%M:%S")

        return expires_at_timestamp.timestamp() < datetime.datetime.now(datetime.timezone.utc).timestamp()


class Game:
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
        self._id = _id
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


# An interface between the Flask app and the sqlite3 database
class Database:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self.connection = connection

    def register_link(self, link_suffix: str = None, game_id: str = None):
        cursor = self.connection.cursor()

        cursor.execute(
            """
                       INSERT INTO Links
                       (LinkURL, CreatedAt, ExpiresAt, Gameid)
                       Values(?, CURRENT_TIMESTAMP, DATETIME('now', '+1 day'), ?)""",
            (link_suffix, game_id),
        )

        self.connection.commit()

    def get_link(self, link_suffix: str):
        cursor = self.connection.cursor()
        print(link_suffix)
        cursor.execute("SELECT * FROM Links WHERE LinkURL = ?", (link_suffix,))

        entry = cursor.fetchone()

        if entry is None:
            return None

        return Link(str(entry[0]), entry[1], entry[2], entry[3], str(entry[4]))

    def get_game(self, game_id: str):
        cursor = self.connection.cursor()

        cursor.execute("SELECT * FROM GameHistory WHERE Gameid = ?", (game_id,))

        entry = cursor.fetchone()

        if entry is None:
            return None

        return Game(
            str(entry[0]),
            entry[1],
            entry[2],
            entry[3],
            entry[4],
            entry[5],
            entry[6],
            str(entry[7]),
            campaign_id=entry[8],
            level_id=entry[9],
        )

    def get_archived_games(self, user_id: str = None):
        cursor = self.connection.cursor()

        if user_id is None:
            cursor.execute("SELECT * FROM GameHistory ORDER BY DatePlayed DESC")
        else:
            cursor.execute("SELECT * FROM GameHistory WHERE Userid = ? ORDER BY DatePlayed DESC", (user_id,))

        entries = cursor.fetchall()

        return [
            Game(
                str(row[0]),
                row[1],
                row[2],
                row[3],
                row[4],
                row[5],
                row[6],
                str(row[7]),
                campaign_id=row[8],
                level_id=row[9],
            )
            for row in entries
        ]

    def archive_game(
        self,
        user_id,
        move_list: str = None,
        game_result: str = None,
        human_plays_as: str = None,
        winner: str = None,
        custom_settings: str = r"{}",
    ) -> None:
        cursor = self.connection.cursor()

        cursor.execute(
            """
                INSERT INTO GameHistory (MoveList, GameResult, DatePlayed, CustomSettings, Userid, HumanPlaysAs, Winner)
                VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
            """,
            (move_list, game_result, custom_settings, user_id, human_plays_as, winner),
        )

        self.connection.commit()

    def get_user(self, email: str = "", _id: str = "") -> User | None:
        cursor = self.connection.cursor()

        if _id:
            cursor.execute("SELECT * FROM Users WHERE Userid = ?", (_id,))
        elif email:
            cursor.execute("SELECT * FROM Users WHERE Email = ?", (email,))
        else:
            raise ValueError("An email or user id must be provided")

        row = cursor.fetchone()

        if not row:
            return None

        return User(str(row[0]), row[1], row[2], row[3], row[4])

    def get_all_users(self):
        cursor = self.connection.cursor()

        cursor.execute("SELECT * FROM Users ORDER BY Userid")

        entries = cursor.fetchall()

        return [User(str(row[0]), row[1], row[2], row[3], row[4]) for row in entries]

    def insert_user(self, email: str = "", password_hash: str = "", auth_level: int = 1, name: str = "") -> None:
        cursor = self.connection.cursor()

        cursor.execute(
            """
                       INSERT INTO Users
                       (Email, PasswordHash, AuthenticationLevel, Name)
                       Values(?, ?, ?, ?)""",
            (email, password_hash, auth_level, name),
        )

        self.connection.commit()

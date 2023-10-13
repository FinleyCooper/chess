import sqlite3
from typing import Tuple
from database.table_classes import CampaignLevel, User, Link, Game
from database.create_tables import create_tables

# An interface between the Flask app and the sqlite3 database
class Database:
    def __init__(self, connection: sqlite3.Connection) -> None:
        connection.execute("PRAGMA foregin_keys = ON")
        create_tables(connection)
        
        self.connection = connection

    def update_user(self, user_id: str, display_name: str):
        cursor = self.connection.cursor()

        cursor.execute("UPDATE Users SET Name = ? WHERE Userid = ?", (display_name, user_id))

        self.connection.commit()
    

    def delete_user(self, user_id: str):
        cursor = self.connection.cursor()

        cursor.execute("DELETE FROM Users WHERE Userid = ?", (user_id,))
        
        self.connection.commit()

    def update_adventure_level(self, user_id: str, level_id: str):
        cursor = self.connection.cursor()

        cursor.execute("UPDATE UserCampaign SET Levelid = ? WHERE Userid = ?", (level_id, user_id))

        self.connection.commit()

    def get_adventure_level(self, level_id: str):
        cursor = self.connection.cursor()

        cursor.execute("SELECT * FROM CampaignLevels WHERE Levelid = ?", (level_id,))

        entry = cursor.fetchone()

        if entry is None:
            return None

        return CampaignLevel(entry[0], entry[1], entry[2])

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

    def get_link(self, link_suffix: str) -> None | Tuple[Link, str]:
        cursor = self.connection.cursor()

        cursor.execute(
            """
                    SELECT Links.*, GameHistory.Userid
                    FROM Links
                    INNER JOIN GameHistory ON Links.Gameid = GameHistory.Gameid
                    WHERE Links.LinkURL = ?
                """,
            (link_suffix,),
        )

        entry = cursor.fetchone()

        if entry is None:
            return None

        return Link(str(entry[0]), entry[1], entry[2], entry[3], str(entry[4])), str(entry[5])

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
        campaign_id: str = None,
        level_id: str = None,
    ) -> None:
        cursor = self.connection.cursor()

        cursor.execute(
            """
                INSERT INTO GameHistory (MoveList, GameResult, DatePlayed, CustomSettings, Userid, HumanPlaysAs, Winner, Campaignid, Levelid)
                VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)
            """,
            (move_list, game_result, custom_settings, user_id, human_plays_as, winner, campaign_id, level_id),
        )

        self.connection.commit()

    def get_user(self, email: str = "", _id: str = "") -> User | None:
        cursor = self.connection.cursor()

        if _id:
            cursor.execute(
                """
                    SELECT Users.*, UserCampaign.Levelid
                    FROM Users
                    INNER JOIN UserCampaign ON Users.Userid = UserCampaign.Userid
                    WHERE UserCampaign.Userid = ?
                """,
                (_id,),
            )
        elif email:
            cursor.execute(
                """
                    SELECT Users.*, UserCampaign.Levelid
                    FROM Users
                    JOIN UserCampaign ON Users.Userid = UserCampaign.Userid
                    WHERE Users.Email = ?
                """,
                (email,),
            )
        else:
            raise ValueError("An email or user id must be provided")

        row = cursor.fetchone()

        if not row:
            return None

        return User(str(row[0]), row[1], row[2], row[3], row[4], str(row[5]))

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
                       VALUES (?, ?, ?, ?)""",
            (email, password_hash, auth_level, name),
        )

        cursor.execute("INSERT INTO UserCampaign (Userid, Levelid) VALUES (last_insert_rowid(), 1)", ())

        self.connection.commit()

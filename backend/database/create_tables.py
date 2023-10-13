import database.adventure_script
import json
import sqlite3


def create_tables(connection):
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS Users (
            Userid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            Email TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            AuthenticationLevel int NOT NULL,
            Name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS CampaignLevels (
            Levelid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            Text TEXT NOT NULL,
            BattleSettings TEXT
        );

        CREATE TABLE IF NOT EXISTS UserCampaign (
            Campaignid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            Userid INTEGER NOT NULL,
            Levelid INTEGER NOT NULL,
            FOREIGN KEY (Userid) REFERENCES Users (Userid) ON DELETE CASCADE,
            FOREIGN KEY (Levelid) REFERENCES CampaignLevels (Levelid)
        );

        CREATE TABLE IF NOT EXISTS GameHistory (
            Gameid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            MoveList TEXT NOT NULL,
            GameResult TEXT NOT NULL,
            DatePlayed TIMESTAMP NOT NULL,
            CustomSettings TEXT NOT NULL,
            HumanPlaysAs INTEGER NOT NULL,
            Winner INTEGER NOT NULL,
            Userid INTEGER NOT NULL,
            Campaignid INTEGER,
            Levelid INTEGER,
            FOREIGN KEY (Campaignid) REFERENCES UserCampaign (Campaignid),
            FOREIGN KEY (Userid) REFERENCES Users (Userid),
            FOREIGN KEY (Levelid) REFERENCES CampaignLevels (Levelid)
        );

        CREATE TABLE IF NOT EXISTS Links (
            Linkid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            LinkURL TEXT NOT NULL,
            CreatedAt TIMESTAMP NOT NULL,
            ExpiresAt TIMESTAMP NOT NULL,
            Gameid INTEGER NOT NULL,
            FOREIGN KEY (Gameid) REFERENCES GameHistory (Gameid)
        );
    """
    )

    # Add adventure information
    cursor = connection.cursor()

    try:
        for level in database.adventure_script.levels:
            text = json.dumps(level.get("text"))
            battle_settings = json.dumps(level.get("battle")) if level.get("battle") is not None else None

            cursor.execute(
                "INSERT INTO CampaignLevels (Levelid, Text, BattleSettings) VALUES (?, ?, ?)",
                (level["id"], text, battle_settings),
            )
    except sqlite3.IntegrityError:
        print("CampaignLevels data already inserted")
    finally:
        cursor.close()
        connection.commit()

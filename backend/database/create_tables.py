import sqlite3

# If using docker, this must be executed in the backend container
connection = sqlite3.connect(r"C:\Users\finle\Coding\NEA\backend\database\data\data.db")


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
        Name TEXT NOT NULL,
        Description TEXT NOT NULL,
        EngineSettings TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS UserCampaign (
        Campaignid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        Userid INTEGER NOT NULL,
        Levelid INTEGER NOT NULL,
        FOREIGN KEY (Userid) REFERENCES Users (Userid),
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

connection.commit()

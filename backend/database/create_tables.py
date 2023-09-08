import sqlite3

# If using docker, this must be executed in the backend container
connection = sqlite3.connect(r"C:\Users\finle\Coding\NEA\backend\database\data\data.db")

connection.execute(
    """
    CREATE TABLE IF NOT EXISTS Users (
                   Userid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                   Email TEXT NOT NULL,
                   PasswordHash TEXT NOT NULL,
                   AuthenticationLevel int NOT NULL,
                   Name TEXT NOT NULL
    )
"""
)

connection.commit()

import sqlite3


class User:
    def __init__(self, _id: str, email: str, password_hash: str, auth_level: int, name: str):
        self._id = _id
        self.email = email
        self.password_hash = password_hash
        self.auth_level = auth_level
        self.name = name


# An interface between the Flask app and the sqlite3 database
class Database:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self.connection = connection

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

        return User(row[0], row[1], row[2], row[3], row[4])

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

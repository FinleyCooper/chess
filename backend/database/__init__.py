import sqlite3


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

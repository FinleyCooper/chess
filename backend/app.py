from flask import Flask, request, jsonify
from functools import wraps
import sqlite3
import re

import crypto_auth
import database
import constants

app = Flask(__name__)
app.config.from_object("config.DevConfig")

connection = sqlite3.connect(constants.database_path)

db = database.Database(connection)


# Authorisation decorator
def authorisation_required(level):
    def decorator(func):
        @wraps(func)
        def wrapped_function(*args, **kwargs):
            token = request.cookies.get("token")
            decoded_token = crypto_auth.verify(token=token, public_key=app.config["PUBLIC_KEY"])

            # Handles invalid signatures and expired tokens
            if decoded_token["failure"]:
                return jsonify({"error": True, "message": decoded_token["failure"]}), 401

            requested_user_id = kwargs.get("user_id")

            print(decoded_token)

            # User specific authorisation
            if requested_user_id is not None:
                # Only admins can access information not relating to them
                if decoded_token["authorisation_level"] >= constants.AuthorisationLevel.admin:
                    return func(*args, **kwargs)
                elif decoded_token["id"] == requested_user_id and level <= decoded_token["authorisation_level"]:
                    return func(*args, **kwargs)
                else:
                    return jsonify({"error": True, "message": "Forbidden"}), 403

            # Non-user specific authorisation
            if decoded_token["authorisation_level"] >= level:
                return func(*args, **kwargs)

            return jsonify({"error": True, "message": "Forbidden"}), 403

        return wrapped_function

    return decorator


@app.route("/api/users/all", methods=["GET"])
@authorisation_required(level=constants.AuthorisationLevel.admin)
def get_all_users():
    users = db.get_all_users()

    return jsonify({"error": False, "data": [user.to_dict() for user in users]}), 200


@app.route("/api/users/<user_id>", methods=["GET"])
@authorisation_required(level=constants.AuthorisationLevel.default)
def get_user(user_id: str = None):
    user = db.get_user(_id=user_id)

    if user is None:
        return jsonify({"error": True, "message": "User does not exist"}), 404

    return jsonify({"error": False, "data": user.to_dict()}), 200


@app.route("/api/signup", methods=["POST"])
def signup():
    content = request.json

    if not content:
        return jsonify({"error": True, "message": "No data was provided in the request"}), 400

    email = str(content.get("email"))
    name = str(content.get("name"))
    password = str(content.get("password"))

    if email is None or not re.match(constants.emailRegex, email):
        return jsonify({"error": True, "message": "Valid email not provided in the request"}), 400

    if name is None or not re.match(constants.displayNameRegex, name):
        return jsonify({"error": True, "message": "Valid display name not provided in the request"}), 400

    if password is None or not re.match(constants.passwordRegex, password):
        return jsonify({"error": True, "message": "Valid password not provided in the request"}), 400

    user_exists = db.get_user(email=email) is not None

    if user_exists:
        return jsonify({"error": True, "message": "Account already exists with this email address"}), 409

    password_hash = crypto_auth.create_password_hash(password)

    db.insert_user(email=email, password_hash=password_hash, name=name)

    return jsonify({"error": False, "message": "Account created - Please Login"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    content = request.json

    if not content:
        return jsonify({"error": True, "message": "No data was provided in the request"}), 400

    email = str(content.get("email"))
    password = str(content.get("password"))

    if email is None:
        return jsonify({"error": True, "message": "Email not provided in the request"}), 400

    if password is None:
        return jsonify({"error": True, "message": "Password not provided in the request"}), 400

    user = db.get_user(email=email)

    if user is None or not crypto_auth.check_password_hash(password, user.password_hash):
        return jsonify({"error": True, "message": "The credentials provided were invalid"}), 401

    dur = constants.token_dur

    token = crypto_auth.create_token(
        {"authorisation_level": user.auth_level, "id": user._id},
        duration=dur,
        private_key=app.config["PRIVATE_KEY"],
    )

    response = jsonify({"error": False, "message": "Successfully logged in"})

    response.set_cookie(
        "token", value=token, max_age=dur, secure=True, httponly=True, samesite="Strict", domain=app.config["DOMAIN"]
    )

    response.set_cookie(
        "isLoggedIn", "true", max_age=dur, httponly=False, samesite="Strict", domain=app.config["DOMAIN"]
    )

    return response, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)

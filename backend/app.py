from flask import Flask, request, jsonify, redirect
from functools import wraps
import sqlite3
import re
import json
import random
import base64

import crypto_auth
import database
import constants as const

app = Flask(__name__)
app.config.from_object("config.DevConfig")

connection = sqlite3.connect(const.database_path)

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

            # User specific authorisation
            if requested_user_id is not None and requested_user_id != "@me":
                # Only admins can access information not relating to them or we are using a temp token
                if (
                    decoded_token["authorisation_level"] >= const.AuthLevel.admin
                    or decoded_token["authorisation_level"] == const.AuthLevel.unauthenicatedUser
                ):
                    return func(*args, **kwargs, decoded_token=decoded_token)
                elif decoded_token["id"] == requested_user_id and level <= decoded_token["authorisation_level"]:
                    return func(*args, **kwargs, decoded_token=decoded_token)
                else:
                    return jsonify({"error": True, "message": "Forbidden"}), 403

            # Non-user specific authorisation
            if decoded_token["authorisation_level"] >= level:
                return func(*args, **kwargs, decoded_token=decoded_token)

            return jsonify({"error": True, "message": "Forbidden"}), 403

        return wrapped_function

    return decorator


@app.route("/api/users/<user_id>/games/<game_id>/link", methods=["GET"])
@authorisation_required(level=const.AuthLevel.default)
def get_shareable_link(user_id: str = None, game_id: str = None, decoded_token: dict = {}):
    game = db.get_game(game_id)

    if game is None:
        return jsonify({"error": True, "message": "Game does not exist"}), 404

    # Create a link url suffix. Chance of collision is 2^-218 which is negliable
    link_suffix = base64.urlsafe_b64encode(random.randbytes(16)).decode("utf-8")[:-2]

    db.register_link(link_suffix=link_suffix, game_id=game_id)

    return jsonify({"error": True, "data": {"linkPath": f"/s/{link_suffix}"}}), 200


@app.route("/s/<link_suffix>", methods=["GET"])
def redirect_to_game(link_suffix: str = None):
    link = db.get_link(link_suffix)

    if link is None:
        return "Link does not exist", 404
    if link.isExpired():
        return "Link has expired", 400

    # Give them a short token with small scope
    dur = 86400  # One day
    token = crypto_auth.create_token(
        {"authorisation_level": const.AuthLevel.unauthenicatedUser, "id": "-1", "gameid": link.game_id},
        duration=dur,
        private_key=app.config["PRIVATE_KEY"],
    )

    response = redirect(f"{app.config['ORIGIN']}/review?gameid={link.game_id}")

    response.set_cookie(
        "token", value=token, max_age=dur, secure=True, httponly=True, samesite="Strict", domain=app.config["DOMAIN"]
    )

    return response


@app.route("/api/users/all", methods=["GET"])
@authorisation_required(level=const.AuthLevel.admin)
def get_all_users(decoded_token: dict = {}):
    users = db.get_all_users()

    return jsonify({"error": False, "data": [user.to_dict() for user in users]}), 200


@app.route("/api/users/<user_id>", methods=["GET"])
@authorisation_required(level=const.AuthLevel.default)
def get_user(user_id: str = None, decoded_token: dict = {}):
    if user_id == "@me":
        user = db.get_user(_id=decoded_token["id"])
    else:
        user = db.get_user(_id=user_id)

    if user is None:
        return jsonify({"error": True, "message": "User does not exist"}), 404

    return jsonify({"error": False, "data": user.to_dict()}), 200


@app.route("/api/users/<user_id>/games/<game_id>", methods=["GET"])
@authorisation_required(level=const.AuthLevel.unauthenicatedUser)
def get_game_from_user(user_id: str = None, game_id: str = None, decoded_token: dict = {}):
    if (
        decoded_token["authorisation_level"] == const.AuthLevel.unauthenicatedUser
        and decoded_token.get("gameid") != game_id
    ):
        return jsonify({"error": True, "message": "Forbidden"}), 403

    game = db.get_game(game_id)

    if game is None:
        return jsonify({"error": True, "message": "Game does not exist"}), 404

    return jsonify({"error": False, "data": game.to_dict()}), 404


@app.route("/api/users/<user_id>/games/all", methods=["GET"])
@authorisation_required(level=const.AuthLevel.default)
def get_games_from_user(user_id: str = None, decoded_token: dict = {}):
    games = db.get_archived_games(user_id=user_id)

    return jsonify({"error": False, "data": [game.to_dict() for game in games]}), 200


@app.route("/api/users/<user_id>/games", methods=["POST"])
@authorisation_required(level=const.AuthLevel.default)
def archive_game(user_id: str = None, decoded_token: dict = {}):
    content = request.json

    if not content:
        return jsonify({"error": True, "message": "No data was provided in the request"}), 400

    move_list = str(content.get("moveList"))
    game_result = str(content.get("gameResult"))
    custom_settings = content.get("customSettings")
    human_plays_as = int(content.get("humanPlaysAs"))
    winner = int(content.get("winner"))

    if not move_list or not game_result or not human_plays_as or not winner:
        return jsonify({"error": True, "message": "All game data not provided in the request"}), 400

    user = db.get_user(_id=user_id)

    if user is None:
        return jsonify({"error": True, "message": "User does not exist"}), 404

    db.archive_game(
        user_id,
        move_list=move_list,
        game_result=game_result,
        human_plays_as=human_plays_as,
        winner=winner,
        custom_settings=(json.dumps(custom_settings, sort_keys=True) if custom_settings is not None else None),
    )

    return jsonify({"error": False, "message": "Game successfully archived"}), 201


@app.route("/api/signup", methods=["POST"])
def signup():
    content = request.json

    if not content:
        return jsonify({"error": True, "message": "No data was provided in the request"}), 400

    email = str(content.get("email"))
    name = str(content.get("name"))
    password = str(content.get("password"))

    if email is None or not re.match(const.emailRegex, email):
        return jsonify({"error": True, "message": "Valid email not provided in the request"}), 400

    if name is None or not re.match(const.displayNameRegex, name):
        return jsonify({"error": True, "message": "Valid display name not provided in the request"}), 400

    if password is None or not re.match(const.passwordRegex, password):
        return jsonify({"error": True, "message": "Valid password not provided in the request"}), 400

    user_exists = db.get_user(email=email) is not None

    if user_exists:
        return jsonify({"error": True, "message": "Account already exists with this email address"}), 409

    password_hash = crypto_auth.create_password_hash(password)

    db.insert_user(email=email, password_hash=password_hash, name=name, auth_level=const.AuthLevel.default)

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

    dur = const.token_dur

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

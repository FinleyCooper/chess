import base64
import json
import random
import re
import sqlite3

import constants as const
import crypto_auth
import database
from decorators import authorisation_required
from flask import Flask, jsonify, redirect, request

app = Flask(__name__)
app.config.from_object("config.DevConfig")

connection = sqlite3.connect(const.database_path)

db = database.Database(connection)


@app.route("/api/users/<user_id>", methods=["PATCH"])
@authorisation_required(level=const.AuthLevel.default)
def update_display_name(user_id: str = None, decoded_token: dict = {}):
    content = request.json

    display_name = str(content.get("displayName"))

    if not display_name:
        return jsonify({"error": True, "message": "Invalid details given to update"}), 400
    
    db.update_user(user_id=user_id, display_name=display_name)

    return jsonify({"error": False, "message": "User successfully updated"}), 200



@app.route("/api/users/<user_id>", methods=["DELETE"])
@authorisation_required(level=const.AuthLevel.default)
def delete_user(user_id: str = None, decoded_token: dict = {}):
    db.delete_user(user_id=user_id)

    response = jsonify({"error": False, "message": "User successfully deleted"})
        
    response.set_cookie(
        "token", value="deleted", expires=0, secure=True, httponly=True, samesite="Strict", domain=app.config["DOMAIN"]
    )

    response.set_cookie(
        "isLoggedIn", "false", expires=0, httponly=False, samesite="Strict", domain=app.config["DOMAIN"]
    )

    return response, 200

@app.route("/api/users/<user_id>/adventure-levels", methods=["PATCH"])
@authorisation_required(level=const.AuthLevel.default)
def update_adventure_level(user_id: str = None, decoded_token: dict = {}):
    content = request.json

    if not content:
        return jsonify({"error": True, "message": "No data was provided in the request"}), 400

    level_id = str(content.get("levelid"))

    if not level_id:
        return jsonify({"error": True, "message": "No valid level id was provided in the request"}), 400

    db.update_adventure_level(user_id, level_id)

    return jsonify({"error": False, "message": "Level id successfully updated"}), 200


@app.route("/api/adventure-levels/<level_id>")
def get_adventure_level(level_id):
    level = db.get_adventure_level(level_id)

    if level is None:
        return jsonify({"error": True, "message": "Level does not exist"}), 404

    return jsonify({"error": False, "data": level.to_dict()}), 200


@app.route("/api/users/<user_id>/games/<game_id>/link", methods=["GET"])
@authorisation_required(level=const.AuthLevel.default)
def get_shareable_link(user_id: str = None, game_id: str = None, decoded_token: dict = {}):
    game = db.get_game(game_id)

    if game is None:
        return jsonify({"error": True, "message": "Game does not exist"}), 404

    # Create a link url suffix. Chance of collision is 2^-218 which is negliable
    link_suffix = base64.urlsafe_b64encode(random.randbytes(16)).decode("utf-8")[:-2]

    db.register_link(link_suffix=link_suffix, game_id=game_id)

    return jsonify({"error": False, "data": {"linkPath": f"/s/{link_suffix}"}}), 200


@app.route("/s/<link_suffix>", methods=["GET"])
def redirect_to_game(link_suffix: str = None):
    link, user_id = db.get_link(link_suffix)

    if link is None:
        return "Link does not exist", 404
    if link.isExpired():
        return "Link has expired", 400

    # Give them a short token with small scope
    dur = 86400  # One day
    temp_token = crypto_auth.create_token(
        {"authorisation_level": const.AuthLevel.unauthenicatedUser, "id": user_id, "gameid": link.game_id},
        duration=dur,
        private_key=app.config["PRIVATE_KEY"],
    )

    response = redirect(f"{app.config['ORIGIN']}/review?gameid={link.game_id}&userid={user_id}")

    response.set_cookie(
        "tempToken",
        value=temp_token,
        max_age=dur,
        secure=True,
        httponly=True,
        samesite="Strict",
        domain=app.config["DOMAIN"],
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
    game = db.get_game(game_id)

    if game is None:
        return jsonify({"error": True, "message": "Game does not exist"}), 404

    return jsonify({"error": False, "data": game.to_dict()}), 200


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
    level_id = str(content.get("levelid"))
    campaign_id = str(content.get("campaignid"))

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
        level_id=level_id,
        campaign_id=campaign_id,
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

from flask import Flask, request, jsonify
import re
import sqlite3

import crypto_auth
import database
import constants

app = Flask(__name__)
app.config.from_object("config.DevConfig")

connection = sqlite3.connect(constants.database_path)

db = database.Database(connection)


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

    return response, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)

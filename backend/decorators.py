from functools import wraps

import constants as const
import crypto_auth
from flask import current_app, jsonify, request


def match_scopes(token: dict, scopes: dict):
    if type(token) != dict:
        return False
    
    if token["authorisation_level"] >= const.AuthLevel.admin:
        return True

    for key, value in scopes.items():
        if value != token.get(key):
            return False

    return True


def authorisation_required(level):
    def decorator(func):
        @wraps(func)
        def wrapped_function(*args, **kwargs):
            app = current_app

            fullToken = request.cookies.get("token")
            tempToken = request.cookies.get("tempToken")

            decoded_full_token = crypto_auth.verify(token=fullToken, public_key=app.config["PUBLIC_KEY"])
            decoded_temp_token = crypto_auth.verify(token=tempToken, public_key=app.config["PUBLIC_KEY"])

            req_user_id = kwargs.get("user_id")
            req_game_id = kwargs.get("game_id")

            # Decide which token we should be using
            if level != const.AuthLevel.unauthenicatedUser:
                # We cannot use the temp token here
                token = decoded_full_token
            else:
                # If scopes match, we can use the temp token
                if match_scopes(decoded_temp_token, {"id": req_user_id, "gameid": req_game_id}):
                    token = decoded_temp_token
                else:
                    token = decoded_full_token

            # Handles invalid signatures and expired tokens
            if token["failure"]:
                return jsonify({"error": True, "message": decoded_full_token["failure"]}), 401

            # If our full token does not match the user (and isn't a @me request) then they are 403
            if not match_scopes(token, {"id": req_user_id}) and req_user_id != "@me":
                return jsonify({"error": True, "message": "Forbidden"}), 403

            # User specific authorisation
            if req_user_id is not None:
                # Only admins can access information not relating to them
                if token["authorisation_level"] >= const.AuthLevel.admin:
                    return func(*args, **kwargs, decoded_token=token)
                elif level <= token["authorisation_level"]:
                    return func(*args, **kwargs, decoded_token=token)
                else:
                    return jsonify({"error": True, "message": "Forbidden"}), 403

            # Non-user specific authorisation
            if token["authorisation_level"] >= level:
                return func(*args, **kwargs, decoded_token=token)

            return jsonify({"error": True, "message": "Forbidden"}), 403

        return wrapped_function

    return decorator

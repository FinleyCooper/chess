import time
import json
import base64
import math
from hashlib import sha256
from random import SystemRandom

from crypto_auth import elliptic_curve
import constants


dict_to_json = lambda d: json.dumps(d, sort_keys=True, separators=(",", ":"))  # consistancy between messages


def create_token(msg: dict, duration: int = 86400, private_key: int = 0) -> str:
    if not private_key:
        raise ValueError("Private key must be specified")

    current_time = time.time()

    msg["signedAt"] = current_time
    msg["invalidAt"] = current_time + duration

    jsonified_message = dict_to_json(msg)

    signature = elliptic_curve.curve.createSignature(bytes(jsonified_message, "utf-8"), private_key)

    base64_signature = base64.b64encode(
        int.to_bytes(signature, length=2 * math.ceil(elliptic_curve.curve.n_bitlength / 8), byteorder="big")
    ).decode()

    msg["signature"] = base64_signature

    return base64.b64encode(bytes(dict_to_json(msg), "utf-8")).decode()


def verify(token: str, public_key: int) -> dict:
    if not token:
        return {"failure": "Token not provided"}
    # base64 json to dictionary
    msg = json.loads(base64.b64decode(token).decode())

    if time.time() > msg["invalidAt"]:
        return {"failure": "Token expired"}

    signature = int.from_bytes(base64.b64decode(msg["signature"]), byteorder="big")

    del msg["signature"]

    message_bytearray = bytes(dict_to_json(msg), "utf-8")

    if elliptic_curve.curve.verifySignature(message_bytearray, signature, public_key):
        del msg["signedAt"]
        del msg["invalidAt"]
        msg["failure"] = False
        return msg
    else:
        return {"failure": "Token signature invalid"}


def create_password_hash(password: str, salt: int | None = None) -> str:
    salt = (
        int.from_bytes(SystemRandom().randbytes(constants.salt_bytelength), byteorder="big") if salt is None else salt
    )

    password_bytes = bytes(password, "utf-8")

    password_numeric = int.from_bytes(password_bytes, byteorder="big")

    combined_numeric = salt | (password_numeric << (constants.salt_bytelength * 8))

    combined_bytes_length = math.ceil(((math.floor(math.log2(password_numeric))) + 1) / 8) + constants.salt_bytelength
    combined_bytes = int.to_bytes(combined_numeric, combined_bytes_length, byteorder="big")

    return sha256(combined_bytes, usedforsecurity=True).hexdigest() + " " + str(salt)


def check_password_hash(password: str, password_hash: str) -> bool:
    digest_hex, salt_string = password_hash.split(" ")

    check_digest_hash, _ = create_password_hash(password, int(salt_string)).split(" ")

    return check_digest_hash == digest_hex

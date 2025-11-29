import os
import datetime
import re

import redis
import jwt
from flask import Flask, request, jsonify
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

# -----------------------------
# Configuration
# -----------------------------

REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_DB = int(os.environ.get("REDIS_DB", 0))
REDIS_SOCKET_TIMEOUT = float(os.environ.get("REDIS_SOCKET_TIMEOUT", 2.0))
REDIS_SOCKET_CONNECT_TIMEOUT = float(os.environ.get("REDIS_SOCKET_CONNECT_TIMEOUT", 2.0))
REDIS_TLS = os.environ.get("REDIS_TLS", "false").lower() == "true"

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = os.environ.get("JWT_ALGO", "HS256")
TOKEN_EXP_HOURS = 24

app = Flask(__name__)
CORS(app)  # allow cross-origin (for React frontend)

_redis_client = None


def get_redis():
    """
    Lazy Redis client with TLS support for AWS ElastiCache.
    """
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    try:
        client = redis.StrictRedis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True,
            socket_timeout=REDIS_SOCKET_TIMEOUT,
            socket_connect_timeout=REDIS_SOCKET_CONNECT_TIMEOUT,
            ssl=REDIS_TLS,
            ssl_cert_reqs=None,  # NOTE: for demo; in production validate certificates
        )
        client.ping()
        _redis_client = client
        app.logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}, tls={REDIS_TLS}")
        return _redis_client
    except Exception as e:
        app.logger.error(f"Redis connect failed: {e}")
        _redis_client = None
        return None


# -----------------------------
# Helper functions
# -----------------------------

def generate_user_key(email: str) -> str:
    return f"user:{email}"


def notifications_key(email: str) -> str:
    return f"settings:notifications:{email}"


def billing_key(email: str) -> str:
    return f"settings:billing:{email}"


def plans_key(email: str) -> str:
    return f"settings:plans:{email}"


def create_token(email: str) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub": email,
        "iat": now,
        "exp": now + datetime.timedelta(hours=TOKEN_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
            request.user_email = payload.get("sub")
            if not request.user_email:
                raise Exception("Invalid token payload")
        except Exception as e:
            app.logger.warning(f"Auth failed: {e}")
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return wrapper


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email or ""))


def is_strong_password(pw: str):
    """
    Returns (ok: bool, message: str)
    """
    if len(pw) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", pw):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[0-9]", pw):
        return False, "Password must contain at least one digit"
    return True, ""


# -----------------------------
# Basic health routes
# -----------------------------

@app.route("/", methods=["GET"])
def root():
    """
    Base health check for API Gateway root URL.
    """
    return jsonify({
        "status": "running",
        "service": "User Account API",
        "auth": "enabled"
    }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# -----------------------------
# Auth routes
# -----------------------------

@app.route("/auth/signup", methods=["POST"])
def signup():
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    required = ["email", "first_name", "last_name", "password", "confirm_password"]
    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    email = data["email"].strip().lower()
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    pw = data["password"]
    confirm_pw = data["confirm_password"]
    if pw != confirm_pw:
        return jsonify({"error": "Password and confirm password do not match"}), 400

    ok, msg = is_strong_password(pw)
    if not ok:
        return jsonify({"error": msg}), 400

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    if r.exists(user_key):
        return jsonify({"error": f"User with email '{email}' already exists"}), 409

    hashed = generate_password_hash(pw)
    record = {
        "email": email,
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "password": hashed,
    }

    try:
        r.hset(user_key, mapping=record)
        token = create_token(email)
        return jsonify({
            "message": "Signup successful",
            "token": token,
            "user": {
                "email": email,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
            },
        }), 201
    except Exception as e:
        app.logger.exception("Signup failed")
        return jsonify({"error": f"Failed to sign up: {str(e)}"}), 500


@app.route("/auth/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    user = r.hgetall(user_key)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    stored_hash = user.get("password", "")
    if not check_password_hash(stored_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_token(email)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "email": email,
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
        },
    }), 200


@app.route("/auth/me", methods=["GET"])
@require_auth
def me():
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(request.user_email)
    user = r.hgetall(user_key)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.pop("password", None)
    return jsonify(user), 200

@app.route("/auth/profile", methods=["PUT"])
@require_auth
def update_profile():
    """
    Securely update first_name / last_name.
    Requires current_password to confirm identity.
    """
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    current_password = data.get("current_password")

    if not first_name or not last_name or not current_password:
        return jsonify({"error": "first_name, last_name and current_password are required"}), 400

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    email = request.user_email
    user_key = generate_user_key(email)
    user = r.hgetall(user_key)
    if not user:
        return jsonify({"error": "User not found"}), 404

    stored_hash = user.get("password", "")
    if not check_password_hash(stored_hash, current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    try:
        r.hset(user_key, mapping={"first_name": first_name, "last_name": last_name})
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        app.logger.exception("Profile update failed")
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500


@app.route("/auth/change-password", methods=["POST"])
@require_auth
def change_password():
    """
    Secure password change: requires old_password, new_password, confirm_password.
    """
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not old_password or not new_password or not confirm_password:
        return jsonify({"error": "All password fields are required"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "New password and confirm password do not match"}), 400

    ok, msg = is_strong_password(new_password)
    if not ok:
        return jsonify({"error": msg}), 400

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    email = request.user_email
    user_key = generate_user_key(email)
    user = r.hgetall(user_key)
    if not user:
        return jsonify({"error": "User not found"}), 404

    stored_hash = user.get("password", "")
    if not check_password_hash(stored_hash, old_password):
        return jsonify({"error": "Old password is incorrect"}), 401

    try:
        new_hash = generate_password_hash(new_password)
        r.hset(user_key, "password", new_hash)
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        app.logger.exception("Password change failed")
        return jsonify({"error": f"Failed to change password: {str(e)}"}), 500

# -----------------------------
# Updated delete_account (fixed: per-key delete to avoid ClusterCrossSlotError)
# -----------------------------
@app.route("/auth/delete-account", methods=["DELETE", "POST"])
@require_auth
def delete_account():
    """
    Delete account with per-key deletion to avoid Redis Cluster CROSSSLOT errors.
    Returns diagnostics for debugging.
    """
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    email = request.user_email
    user_key = generate_user_key(email)

    # ensure the user exists and password matches
    try:
        user = r.hgetall(user_key)
    except Exception as e:
        app.logger.exception("Redis hgetall failed when reading user")
        return jsonify({"error": "Failed to read user from Redis", "detail": str(e)}), 500

    if not user:
        return jsonify({"error": "User not found"}), 404

    stored_hash = user.get("password", "")
    if not check_password_hash(stored_hash, password):
        return jsonify({"error": "Password is incorrect"}), 401

    # Build keys using your helper functions
    keys_to_delete = [
        user_key,
        notifications_key(email),
        billing_key(email),
        plans_key(email),
    ]
    keys_to_delete = [k for k in keys_to_delete if k]

    # Gather pre-delete diagnostics
    diagnostics = {"redis_host": REDIS_HOST, "redis_port": REDIS_PORT, "tls": REDIS_TLS}
    try:
        try:
            diagnostics["ping"] = r.ping()
        except Exception as ping_err:
            diagnostics["ping_error"] = str(ping_err)

        diag_keys = {}
        for k in keys_to_delete:
            try:
                exists = bool(r.exists(k))
                ktype = r.type(k) if exists else None
                length = None
                if exists:
                    if ktype == "hash":
                        length = r.hlen(k)
                    elif ktype == "string":
                        length = r.strlen(k)
                    elif ktype == "list":
                        length = r.llen(k)
                    elif ktype == "set":
                        length = r.scard(k)
                    elif ktype == "zset":
                        length = r.zcard(k)
                diag_keys[k] = {"exists": exists, "type": ktype, "length": length}
            except Exception as e:
                app.logger.exception("Failed to inspect key %s", k)
                diag_keys[k] = {"inspect_error": str(e)}

        diagnostics["keys"] = diag_keys
    except Exception as e:
        app.logger.exception("Diagnostics gathering failed")
        return jsonify({"error": "Failed gathering diagnostics", "detail": str(e)}), 500

    # Per-key delete to avoid CROSSSLOT
    try:
        app.logger.info(f"Attempting to delete keys for {email} (per-key): {keys_to_delete}")
        deleted_total = 0
        per_key_results = {}

        for k in keys_to_delete:
            try:
                if hasattr(r, "unlink"):
                    res = r.unlink(k)
                    method = "unlink"
                else:
                    res = r.delete(k)
                    method = "delete"
                per_key_results[k] = {"method": method, "returned": res}
                deleted_total += int(res or 0)
            except Exception as e:
                app.logger.exception("Failed deleting key %s", k)
                per_key_results[k] = {"error": str(e)}

        app.logger.info(f"Per-key delete results: {per_key_results}")
        diagnostics["delete_method"] = "per-key"
        diagnostics["delete_return"] = {"deleted_total": deleted_total, "per_key": per_key_results}

        # Re-check keys post-delete
        post_diag = {}
        for k in keys_to_delete:
            try:
                exists = bool(r.exists(k))
                post_diag[k] = {"exists": exists}
            except Exception as e:
                post_diag[k] = {"post_inspect_error": str(e)}
        diagnostics["post_delete"] = post_diag

        return jsonify({
            "message": "Attempted account deletion (per-key)",
            "diagnostics": diagnostics
        }), 200
    except Exception as e:
        app.logger.exception("Failed to delete account keys")
        diagnostics["delete_exception"] = str(e)
        return jsonify({"error": "Failed to delete account", "diagnostics": diagnostics}), 500

# -----------------------------
# Settings routes (Notifications, Billing, Plans)
# -----------------------------

@app.route("/settings/notifications", methods=["GET", "PUT"])
@require_auth
def settings_notifications():
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    key = notifications_key(request.user_email)

    if request.method == "GET":
        data = r.hgetall(key) or {}
        return jsonify({
            "email_notifications": data.get("email_notifications", "true") == "true",
            "sms_notifications": data.get("sms_notifications", "false") == "true",
            "push_notifications": data.get("push_notifications", "false") == "true",
        }), 200

    # PUT
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400
    data = request.get_json()

    email_notifications = bool(data.get("email_notifications", True))
    sms_notifications = bool(data.get("sms_notifications", False))
    push_notifications = bool(data.get("push_notifications", False))

    r.hset(key, mapping={
        "email_notifications": "true" if email_notifications else "false",
        "sms_notifications": "true" if sms_notifications else "false",
        "push_notifications": "true" if push_notifications else "false",
    })
    return jsonify({"message": "Notification settings saved"}), 200


@app.route("/settings/billing", methods=["GET", "PUT"])
@require_auth
def billing_settings():
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    email = request.user_email
    billing_key_name = billing_key(email)  # use helper (settings:billing:email)

    if request.method == "GET":
        data = r.hgetall(billing_key_name) or {}
        return jsonify({
            "cardholder_name": data.get("cardholder_name", ""),
            "card_last4": data.get("card_last4", ""),
            "invoice_email": data.get("invoice_email", "")
        })

    # PUT
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    payload = request.get_json()
    cardholder_name = payload.get("cardholder_name", "").strip()
    card_number = (payload.get("card_number") or "").strip()
    expiry_month = (payload.get("expiry_month") or "").strip()
    expiry_year = (payload.get("expiry_year") or "").strip()
    cvv = (payload.get("cvv") or "").strip()
    invoice_email = (payload.get("invoice_email") or "").strip()

    if invoice_email and "@" not in invoice_email:
        return jsonify({"error": "Invalid invoice email"}), 400

    # Basic card validations (for demo only)
    digits_only = "".join(ch for ch in card_number if ch.isdigit())
    if card_number:
        if len(digits_only) != 16:
            return jsonify({"error": "Card number must be 16 digits"}), 400
        if not cardholder_name:
            return jsonify({"error": "Cardholder name is required"}), 400
        if not expiry_month or not expiry_year:
            return jsonify({"error": "Expiry month and year are required"}), 400
        if not cvv or len(cvv) < 3:
            return jsonify({"error": "Invalid CVV"}), 400

    stored = r.hgetall(billing_key_name) or {}

    # Only store last4, never full number (demo best practice)
    if digits_only:
        stored["cardholder_name"] = cardholder_name
        stored["card_last4"] = digits_only[-4:]
    if invoice_email:
        stored["invoice_email"] = invoice_email

    r.hset(billing_key_name, mapping=stored)

    return jsonify({"message": "Billing info saved"}), 200

@app.route("/settings/plans", methods=["GET", "PUT"])
@require_auth
def plans_settings():
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    email = request.user_email
    plans_key_name = plans_key(email)
    billing_key_name = billing_key(email)

    if request.method == "GET":
        data = r.hgetall(plans_key_name) or {}
        return jsonify({
            "plan": data.get("plan", "basic"),
            "extra_storage": data.get("extra_storage", "0") == "1",
            "priority_support": data.get("priority_support", "0") == "1"
        })

    # PUT
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    payload = request.get_json()
    plan = payload.get("plan", "basic")
    extra_storage = bool(payload.get("extra_storage", False))
    priority_support = bool(payload.get("priority_support", False))
    total_price = int(payload.get("total_price", 0))

    # If it's a paid plan, ensure billing method exists
    billing_data = r.hgetall(billing_key_name) or {}
    has_card = bool(billing_data.get("card_last4"))

    if total_price > 0 and not has_card:
        return jsonify({"error": "Add a billing method before selecting a paid plan"}), 400

    r.hset(plans_key_name, mapping={
        "plan": plan,
        "extra_storage": "1" if extra_storage else "0",
        "priority_support": "1" if priority_support else "0",
        "last_price": str(total_price)
    })

    return jsonify({"message": "Plan updated successfully"}), 200


# -----------------------------
# User CRUD (self-only)
# -----------------------------

@app.route("/users/<string:email>", methods=["GET"])
@require_auth
def get_user(email):
    email = email.strip().lower()
    if email != request.user_email:
        return jsonify({"error": "Forbidden"}), 403

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    user_data = r.hgetall(user_key)
    if not user_data:
        return jsonify({"error": "User not found"}), 404

    user_data.pop("password", None)
    return jsonify(user_data), 200


@app.route("/users/<string:email>", methods=["PUT"])
@require_auth
def update_user(email):
    email = email.strip().lower()
    if email != request.user_email:
        return jsonify({"error": "Forbidden"}), 403

    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400
    data = request.get_json()

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    if not r.exists(user_key):
        return jsonify({"error": "User not found"}), 404

    update_fields = {}
    if "first_name" in data:
        update_fields["first_name"] = data["first_name"]
    if "last_name" in data:
        update_fields["last_name"] = data["last_name"]
    if "password" in data and data["password"]:
        ok, msg = is_strong_password(data["password"])
        if not ok:
            return jsonify({"error": msg}), 400
        update_fields["password"] = generate_password_hash(data["password"])

    try:
        if update_fields:
            r.hset(user_key, mapping=update_fields)
        return jsonify({"message": "User updated successfully", "email": email}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update user: {str(e)}"}), 500


@app.route("/users/<string:email>", methods=["DELETE"])
@require_auth
def delete_user(email):
    email = email.strip().lower()
    if email != request.user_email:
        return jsonify({"error": "Forbidden"}), 403

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    deleted_count = r.delete(user_key)
    if deleted_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "User deleted successfully", "email": email}), 200


# -----------------------------
# Lambda handler (serverless-wsgi)
# -----------------------------

try:
    from serverless_wsgi import handle_request

    def handler(event, context):
        return handle_request(app, event, context)
except ImportError:
    def handler(event, context):
        return "Not running in Lambda environment", 500


if __name__ == "__main__":
    print(f"Running Flask app locally. Redis host: {REDIS_HOST}:{REDIS_PORT}, tls={REDIS_TLS}")
    app.run(debug=True)

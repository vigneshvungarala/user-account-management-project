# app.py
import os
import json
import redis
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

# --- Configuration (via environment variables) ---
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_DB = int(os.environ.get("REDIS_DB", 0))
# timeouts (seconds) so connection attempts fail fast inside Lambda
REDIS_SOCKET_TIMEOUT = float(os.environ.get("REDIS_SOCKET_TIMEOUT", 2.0))
REDIS_SOCKET_CONNECT_TIMEOUT = float(os.environ.get("REDIS_SOCKET_CONNECT_TIMEOUT", 2.0))
REDIS_TLS = os.environ.get("REDIS_TLS", "false").lower() == "true"

# Flask app
app = Flask(__name__)
CORS(app)

# Lazy Redis client (no blocking at import)
_redis_client = None

def get_redis():
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
            ssl_cert_reqs=None  # dev only
        )
        client.ping()
        _redis_client = client
        app.logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}, tls={REDIS_TLS}")
        return _redis_client
    except Exception as e:
        app.logger.warning(f"Redis connect failed: {e}")
        _redis_client = None
        return None

def generate_user_key(email: str) -> str:
    return f"user:{email.strip().lower()}"

# --- Health endpoint (no Redis) ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

# --- CRUD Endpoints ---

# CREATE
@app.route("/users", methods=["POST"])
def create_user():
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400

    data = request.get_json()
    required = ["email", "first_name", "last_name", "password"]
    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    email = data["email"].strip().lower()
    user_key = generate_user_key(email)

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    try:
        if r.exists(user_key):
            return jsonify({"error": f"User with email '{email}' already exists"}), 409

        hashed = generate_password_hash(data["password"])
        record = {
            "email": email,
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "password": hashed
        }
        r.hset(user_key, mapping=record)
        return jsonify({"message": "User created successfully", "email": email}), 201
    except Exception as e:
        app.logger.exception("Failed to create user")
        return jsonify({"error": f"Failed to create user: {str(e)}"}), 500

# READ single
@app.route("/users/<string:email>", methods=["GET"])
def get_user(email):
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    try:
        user = r.hgetall(user_key)
        if not user:
            return jsonify({"error": "User not found"}), 404
        user.pop("password", None)
        return jsonify(user), 200
    except Exception as e:
        app.logger.exception("Failed to fetch user")
        return jsonify({"error": f"Failed to fetch user: {str(e)}"}), 500

# READ all (uses SCAN for safety)
@app.route("/users", methods=["GET"])
def get_all_users():
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    try:
        users = []
        for key in r.scan_iter(match="user:*", count=100):
            u = r.hgetall(key)
            if u:
                u.pop("password", None)
                users.append(u)
        return jsonify(users), 200
    except Exception as e:
        app.logger.exception("Failed to list users")
        return jsonify({"error": f"Failed to list users: {str(e)}"}), 500

# UPDATE
@app.route("/users/<string:email>", methods=["PUT"])
def update_user(email):
    if not request.is_json:
        return jsonify({"error": "Expected JSON body"}), 400
    data = request.get_json()

    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    try:
        if not r.exists(user_key):
            return jsonify({"error": "User not found"}), 404

        # if updating password, hash it
        if "password" in data and data["password"]:
            data["password"] = generate_password_hash(data["password"])

        # update each field provided
        for field, value in data.items():
            r.hset(user_key, field, value)
        return jsonify({"message": "User updated successfully", "email": email}), 200
    except Exception as e:
        app.logger.exception("Failed to update user")
        return jsonify({"error": f"Failed to update user: {str(e)}"}), 500

# DELETE
@app.route("/users/<string:email>", methods=["DELETE"])
def delete_user(email):
    r = get_redis()
    if r is None:
        return jsonify({"error": "Redis unavailable"}), 503

    user_key = generate_user_key(email)
    try:
        deleted = r.delete(user_key)
        if deleted == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"message": "User deleted successfully", "email": email}), 200
    except Exception as e:
        app.logger.exception("Failed to delete user")
        return jsonify({"error": f"Failed to delete user: {str(e)}"}), 500

# --- Lambda / Serverless handler ---
# Ensure a callable `handler` exists on the `app` module for AWS Lambda
try:
    from serverless_wsgi import handle_request

    def handler(event, context):
        return handle_request(app, event, context)

except Exception as e:
    # Fallback handler returns an informative JSON if serverless_wsgi isn't installed
    def handler(event, context):
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "serverless_wsgi not available in the environment",
                "detail": str(e)
            })
        }

# Local development helper
if __name__ == "__main__":
    # Useful for local development: simple Flask run
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)

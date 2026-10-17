from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash

from database.db import client

ADMIN_DATABASE_NAME = "aura_grand_hotel"

admin_bp = Blueprint("admin", __name__)


def _is_admin(user):
    role = user.get("role") or user.get("account_type") or ""
    return user.get("is_admin") is True or (
        isinstance(role, str) and role.strip().lower() in {"admin", "super_admin"}
    )


@admin_bp.route("/admin-login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not email.strip() or not isinstance(password, str) or not password:
        return jsonify({"error": "Email and password are required"}), 400

    email = email.strip().lower()
    user = client[ADMIN_DATABASE_NAME]["admin_access"].find_one({"email": email})
    if user is None or not _is_admin(user):
        return jsonify({"error": "Invalid email or password"}), 401

    stored_password = user.get("password_hash") or user.get("password")
    if not isinstance(stored_password, str) or not check_password_hash(stored_password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    session.clear()
    session["admin_authenticated"] = True
    session["admin_user_id"] = str(user["_id"])
    session["admin_email"] = email

    return jsonify({
        "message": "Admin login successful",
        "user": {
            "_id": str(user["_id"]),
            "email": email,
            "name": user.get("name"),
        },
    }), 200


@admin_bp.route("/admin-logout", methods=["POST"])
def admin_logout():
    if not session.get("admin_authenticated"):
        return jsonify({"error": "Authentication required"}), 401

    session.clear()
    return jsonify({"message": "Admin logout successful"}), 200
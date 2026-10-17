import os
import sys
from flask import Blueprint, request, jsonify,session
from werkzeug.security import check_password_hash

from database.db import client

LOGIN_DATABASE_NAME = "aura_grand_hotel"

login_bp = Blueprint('login', __name__)

@login_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) and value.strip() for value in (email, password)):
        return jsonify({"error": "Email and password are required"}), 400

    email = email.strip().lower()
    hotel_staffs_collection = client[LOGIN_DATABASE_NAME]["hotel_staff"]
    user = hotel_staffs_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user.get("status") is False or user.get("enabled") is False:
        return jsonify({"error": "This staff account is disabled. Contact your administrator."}), 403

    stored_hash = user.get("password_hash") or user.get("password")
    if not stored_hash or not check_password_hash(stored_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    configured_database_name = user.get("database_name")
    if not isinstance(configured_database_name, str) or not configured_database_name.strip():
        return jsonify({"error": "Database is not configured for this account"}), 500

    database_name = configured_database_name.strip()

    session.clear()
    session["user_id"] = str(user.get("_id"))
    session["database_name"] = database_name
    session["email"] = email

    user_data = {
        "_id": str(user.get("_id")),
        "email": user.get("email"),
        "name": user.get("name"),
        "database": database_name
    }

    return jsonify({
        "message": "Login successful",
        "user": user_data
    }), 200


@login_bp.route('/dashboard-user', methods=['GET'])
def dashboard_user():
    database_name = session.get("database_name")
    email = session.get("email")
    if not session.get("user_id") or not database_name or not email:
        return jsonify({"error": "Authentication required"}), 401

    user = client[database_name]["users"].find_one(
        {"email": email},
        {"_id": 0, "name": 1},
    )
    if not user or not isinstance(user.get("name"), str) or not user["name"].strip():
        return jsonify({"error": "The signed-in user was not found in this database"}), 404

    return jsonify({"name": user["name"].strip()}), 200


@login_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200
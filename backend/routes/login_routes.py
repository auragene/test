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
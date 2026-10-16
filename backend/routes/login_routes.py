import os
import sys
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash

backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from database.db import client

LOGIN_DATABASE_NAME = "aura_grand_hotel"

hotel_staff_bp = Blueprint('hotel_staff', __name__)

@hotel_staff_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) and value.strip() for value in (email, password)):
        return jsonify({"error": "Email and password are required"}), 400

    email = email.strip().lower()
    database_name = LOGIN_DATABASE_NAME
    hotel_staffs_collection = client[database_name]["hotel_staff"]
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
    user_data = {
        "_id": str(user.get("_id")),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role", "staff")
    }

    account_info = {
        "database": database_name,
        "collection": hotel_staffs_collection.name,
        "role": user_data["role"]
    }

    return jsonify({
        "message": "Login successful",
        "user": user_data,
        "account": account_info
    }), 200
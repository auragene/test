from flask import Blueprint, request, jsonify
from database.db import hotel_staffs_collection
from werkzeug.security import check_password_hash

hotel_staff_bp = Blueprint('hotel_staff', __name__)

@hotel_staff_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = hotel_staffs_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    stored_hash = user.get("password_hash") or user.get("password")
    if not stored_hash or not check_password_hash(stored_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    user_data = {
        "_id": str(user.get("_id")),
        "email": user.get("email"),
        "name": user.get("name")
    }

    return jsonify({"message": "Login successful", "user": user_data}), 200
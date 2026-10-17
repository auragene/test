from bson import ObjectId
from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from database.db import client
from routes.login_routes import LOGIN_DATABASE_NAME

settings_bp = Blueprint('settings', __name__)

RESERVED_SETTING_FIELDS = {"_id", "password", "password_hash"}


@settings_bp.route('/get-settings', methods=['GET'])
def get_settings():
    database_name = session.get("database_name")
    if not session.get("user_id") or not database_name:
        return jsonify({"error": "Authentication required"}), 401

    settings_collection = client[database_name]["hotel_settings"]
    settings = settings_collection.find_one({}) or {}
    settings.pop("_id", None)
    return jsonify(settings), 200


@settings_bp.route('/update-settings', methods=['PUT'])
def update_settings():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not data:
        return jsonify({"error": "A non-empty settings object is required"}), 400

    if any(
        not isinstance(key, str)
        or key in RESERVED_SETTING_FIELDS
        or key.startswith("$")
        or "." in key
        for key in data
    ):
        return jsonify({"error": "Settings contain an invalid field"}), 400

    settings_collection = client[database_name]["hotel_settings"]
    settings_collection.update_one({}, {"$set": data}, upsert=True)
    settings = settings_collection.find_one({}) or {}
    settings.pop("_id", None)
    return jsonify(settings), 200


@settings_bp.route('/change-password', methods=['POST'])
def change_password():
    user_id = session.get("user_id")
    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON password object is required"}), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not isinstance(current_password, str) or not isinstance(new_password, str):
        return jsonify({"error": "Current and new passwords are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    staff_collection = client[LOGIN_DATABASE_NAME]["hotel_staff"]
    staff_user = staff_collection.find_one({"_id": ObjectId(user_id)})
    if staff_user is None:
        return jsonify({"error": "Staff account not found"}), 404

    stored_hash = staff_user.get("password_hash") or staff_user.get("password")
    if not stored_hash or not check_password_hash(stored_hash, current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    staff_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {"password_hash": generate_password_hash(new_password)},
            "$unset": {"password": ""},
        },
    )
    return jsonify({"message": "Password changed successfully"}), 200
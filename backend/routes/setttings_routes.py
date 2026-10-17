from flask import Blueprint, jsonify, session
from database.db import client

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/get-settings', methods=['GET'])
def get_settings():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    settings_collection = client[database_name]["hotel_settings"]
    settings = settings_collection.find_one({})
    if settings is None:
        return jsonify({"error": "Settings not found"}), 404

    settings.pop("_id", None)
    return jsonify(settings), 200
from bson import ObjectId
from flask import Blueprint, jsonify, request, session

from database.db import client

ADMIN_DATABASE_NAME = "aura_grand_hotel"

admin_staff_bp = Blueprint("admin_staff", __name__)


@admin_staff_bp.route("/admin/hotel-staff", methods=["GET"])
def get_hotel_staff():
    if session.get("admin_authenticated") is not True:
        return jsonify({"error": "Authentication required"}), 401

    staff_documents = client[ADMIN_DATABASE_NAME]["hotel_staff"].find(
        {},
        {
            "_id": 1,
            "name": 1,
            "email": 1,
            "database_name": 1,
            "role": 1,
            "account_type": 1,
            "enabled": 1,
        },
    ).sort([("name", 1), ("email", 1)])

    staff = [
        {
            "id": str(user["_id"]),
            "name": user.get("name") or "Unnamed staff",
            "email": user.get("email") or "",
            "database_name": user.get("database_name") or "",
            "role": user.get("role") or user.get("account_type") or "Staff",
            "enabled": user.get("enabled") is not False,
        }
        for user in staff_documents
    ]

    return jsonify({"staff": staff}), 200


@admin_staff_bp.route("/admin/hotel-staff/<staff_id>/access", methods=["PATCH"])
def update_hotel_staff_access(staff_id):
    if session.get("admin_authenticated") is not True:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(staff_id):
        return jsonify({"error": "Invalid staff account"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("enabled"), bool):
        return jsonify({"error": "A boolean enabled value is required"}), 400

    result = client[ADMIN_DATABASE_NAME]["hotel_staff"].update_one(
        {"_id": ObjectId(staff_id)},
        {"$set": {"enabled": data["enabled"]}},
    )
    if result.matched_count != 1:
        return jsonify({"error": "Staff account not found"}), 404

    return jsonify({"id": staff_id, "enabled": data["enabled"]}), 200

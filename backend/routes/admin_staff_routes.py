from flask import Blueprint, jsonify, session

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
        },
    ).sort([("name", 1), ("email", 1)])

    staff = [
        {
            "id": str(user["_id"]),
            "name": user.get("name") or "Unnamed staff",
            "email": user.get("email") or "",
            "database_name": user.get("database_name") or "",
            "role": user.get("role") or user.get("account_type") or "Staff",
        }
        for user in staff_documents
    ]

    return jsonify({"staff": staff}), 200

import logging
import re
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash

from database.db import client

ADMIN_DATABASE_NAME = "aura_grand_hotel"
TEMPLATE_DATABASE_NAME = "irani_restaurant"
DATABASE_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,62}$")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
logger = logging.getLogger(__name__)

admin_staff_bp = Blueprint("admin_staff", __name__)


def _staff_response(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name") or "Unnamed staff",
        "phone": user.get("phone") or "",
        "email": user.get("email") or "",
        "hotel_name": user.get("hotel_name") or "",
        "database_name": user.get("database_name") or "",
        "status": user.get("status", user.get("enabled", True)) is not False,
    }


def _initialize_tenant_database(database_name, staff_user, created_at, created_databases):
    template = client[TEMPLATE_DATABASE_NAME]
    collection_names = [
        name for name in template.list_collection_names()
        if not name.startswith("system.")
    ]
    if not collection_names:
        raise RuntimeError(
            f"Template database '{TEMPLATE_DATABASE_NAME}' has no collections."
        )

    tenant = client[database_name]
    for collection_name in collection_names:
        template_collection = template[collection_name]
        tenant.create_collection(collection_name)
        created_databases.add(database_name)
        tenant_collection = tenant[collection_name]

        for index in template_collection.list_indexes():
            if index["name"] == "_id_":
                continue
            options = {
                key: index[key]
                for key in (
                    "unique",
                    "sparse",
                    "expireAfterSeconds",
                    "partialFilterExpression",
                )
                if key in index
            }
            tenant_collection.create_index(
                index["key"],
                name=index["name"],
                **options,
            )

    if "users" not in collection_names:
        tenant.create_collection("users")
        created_databases.add(database_name)

    tenant["users"].insert_one({
        "name": staff_user["restaurant_name"],
        "email": staff_user["email"],
        "phone": staff_user["phone"],
        "role": "admin",
        "password_hash": staff_user["password_hash"],
        "created_at": created_at,
        "updated_at": created_at,
    })

    tenant["hotel_settings"].insert_one({
        "name": staff_user["restaurant_name"],
        "description": "A premium dining experience crafted for every palate.",
        "logo_url": "",
        "banner_url": "",
        "phone": staff_user["phone"],
        "address": "",
        "primary_color": "#00b757",
        "secondary_color": "#d4fe70",
        "welcome_message": (
            f"Welcome to {staff_user['restaurant_name']}! "
            "Scan & order at your leisure."
        ),
        "currency": "₹",
    })

    tenant["products"].insert_one({
        "name": "Fresh Lime Soda",
        "description": "Zesy lime juice with sparkling water, sweet or salted.",
        "image_url": "",
        "category": "Drinks",
        "price": 40,
        "available": True,
        "ingredients": ["Lime Juice", "Soda Water", "Salt / Sugar"],
        "prep_time": "3 minutes",
        "special_notes": "Choose sweet, salted, or mixed.",
        "created_at": created_at,
        "updated_at": created_at,
    })

    tenant["tables"].insert_one({
        "table_name": "A",
        "active": True,
        "customer_counter": 1,
        "created_at": created_at,
        "customer_sequence": 2,
    })


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
            "status": 1,
        },
    ).sort([("name", 1), ("email", 1)])

    staff = [_staff_response(user) for user in staff_documents]

    return jsonify({"staff": staff}), 200


@admin_staff_bp.route("/admin/hotel-staff", methods=["POST"])
def create_hotel_staff():
    if session.get("admin_authenticated") is not True:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON staff account object is required"}), 400

    required_fields = (
        "name",
        "phone",
        "email",
        "hotel_name",
        "database_name",
        "password",
    )
    values = {}
    for field in required_fields:
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            return jsonify({"error": f"{field.replace('_', ' ').capitalize()} is required"}), 400
        values[field] = value.strip()

    values["email"] = values["email"].lower()
    values["database_name"] = values["database_name"].lower()
    if not EMAIL_PATTERN.fullmatch(values["email"]):
        return jsonify({"error": "Enter a valid email address"}), 400
    if not DATABASE_NAME_PATTERN.fullmatch(values["database_name"]):
        return jsonify({
            "error": "Database name must start with a letter and contain only lowercase letters, numbers, or underscores",
        }), 400
    if values["database_name"] in {
        "admin",
        "config",
        "local",
        ADMIN_DATABASE_NAME,
        TEMPLATE_DATABASE_NAME,
    }:
        return jsonify({"error": "That database name is reserved"}), 400
    if len(values["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    if not isinstance(data.get("status"), bool):
        return jsonify({"error": "Account status must be true or false"}), 400

    staff_collection = client[ADMIN_DATABASE_NAME]["hotel_staff"]
    if staff_collection.find_one(
        {"email": {"$regex": f"^{re.escape(values['email'])}$", "$options": "i"}},
        {"_id": 1},
    ):
        return jsonify({"error": "A staff account with this email already exists"}), 409

    database_name = values["database_name"]
    if database_name in client.list_database_names():
        return jsonify({"error": "That database name already exists"}), 409

    created_at = datetime.now(timezone.utc)
    restaurant_name = values["hotel_name"]
    if not restaurant_name.lower().endswith("restaurant"):
        restaurant_name = f"{restaurant_name} Restaurant"
    staff_user = {
        "name": values["name"],
        "phone": values["phone"],
        "email": values["email"],
        "hotel_name": values["hotel_name"],
        "restaurant_name": restaurant_name,
        "database_name": database_name,
        "status": data["status"],
        "password_hash": generate_password_hash(values["password"]),
        "created_at": created_at,
        "updated_at": created_at,
    }

    created_databases = set()
    try:
        _initialize_tenant_database(
            database_name,
            staff_user,
            created_at,
            created_databases,
        )
        staff_user.pop("restaurant_name")
        result = staff_collection.insert_one(staff_user)
        staff_user["_id"] = result.inserted_id
    except Exception:
        logger.exception("Could not create hotel staff account and tenant database")
        if database_name in created_databases:
            try:
                client.drop_database(database_name)
            except Exception:
                logger.exception("Could not remove incomplete tenant database")
        return jsonify({"error": "Could not create the staff account and database"}), 500

    return jsonify({
        "message": "Hotel staff account created",
        "staff": _staff_response(staff_user),
    }), 201


@admin_staff_bp.route("/admin/hotel-staff/<staff_id>/access", methods=["PATCH"])
def update_hotel_staff_access(staff_id):
    if session.get("admin_authenticated") is not True:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(staff_id):
        return jsonify({"error": "Invalid staff account"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("status"), bool):
        return jsonify({"error": "A boolean status value is required"}), 400

    result = client[ADMIN_DATABASE_NAME]["hotel_staff"].update_one(
        {"_id": ObjectId(staff_id)},
        {
            "$set": {
                "status": data["status"],
                "updated_at": datetime.now(timezone.utc),
            },
            "$unset": {"enabled": ""},
        },
    )
    if result.matched_count != 1:
        return jsonify({"error": "Staff account not found"}), 404

    return jsonify({"id": staff_id, "status": data["status"]}), 200

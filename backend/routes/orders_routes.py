from bson import ObjectId
from flask import Blueprint, request, jsonify, session
from pymongo import ReturnDocument

from database.db import client

orders_bp = Blueprint('orders', __name__)

VALID_STATUSES = ["pending", "accepted", "preparing", "ready", "served"]
ACTIVE_STATUSES_EXCLUDE = ["served", "completed"]


@orders_bp.route('/get-orders', methods=['GET'])
def get_orders():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    orders_collection = client[database_name]["orders"]
    query = {}
    if request.args.get("active") == "true":
        query["status"] = {"$nin": ACTIVE_STATUSES_EXCLUDE}
    orders = list(orders_collection.find(query).sort("created_at", -1))
    for order in orders:
        order["_id"] = str(order["_id"])
    return jsonify(orders), 200


@orders_bp.route('/reset-served-orders', methods=['DELETE'])
def reset_served_orders():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    result = client[database_name]["orders"].delete_many({
        "status": {"$in": ["served", "completed"]}
    })
    return jsonify({
        "message": "Served orders reset.",
        "deleted_count": result.deleted_count,
    }), 200


@orders_bp.route('/create-order', methods=['POST'])
def create_order():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON order object is required"}), 400

    orders_collection = client[database_name]["orders"]
    result = orders_collection.insert_one(data)
    return jsonify({"message": "Order created", "id": str(result.inserted_id)}), 201


@orders_bp.route('/update-order-status/<order_id>', methods=['PATCH'])
def update_order_status(order_id):
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(order_id):
        return jsonify({"error": "Invalid order ID"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {"status"}:
        return jsonify({"error": "Only the status field can be updated"}), 400

    status = data["status"]
    if status not in VALID_STATUSES:
        return jsonify({
            "error": f"Status must be one of: {', '.join(VALID_STATUSES)}"
        }), 400

    order = client[database_name]["orders"].find_one_and_update(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status}},
        return_document=ReturnDocument.AFTER,
    )
    if order is None:
        return jsonify({"error": "Order not found"}), 404

    order["_id"] = str(order["_id"])
    return jsonify(order), 200

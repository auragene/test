import math
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from flask import Blueprint, jsonify, request
from pymongo import ReturnDocument

from database.db import client
from routes.login_routes import LOGIN_DATABASE_NAME

customer_bp = Blueprint("customer", __name__)


def _get_tenant_database():
    tenant = request.args.get("tenant", "").strip()
    if not tenant:
        return None, None, (jsonify({"error": "Tenant is required"}), 400)

    tenant_exists = client[LOGIN_DATABASE_NAME]["hotel_staff"].find_one(
        {"database_name": tenant},
        {"_id": 1},
    )
    if not tenant_exists:
        return None, None, (jsonify({"error": "Unknown tenant"}), 404)

    return tenant, client[tenant], None


def _find_table(database, table_id):
    if not ObjectId.is_valid(table_id):
        return None
    return database["tables"].find_one({"_id": ObjectId(table_id)})


@customer_bp.route("/customer/menu/<table_id>", methods=["GET"])
def get_customer_menu(table_id):
    _, database, error = _get_tenant_database()
    if error:
        return error

    table = _find_table(database, table_id)
    if table is None:
        return jsonify({"error": "Table not found"}), 404

    products = list(database["products"].find({"available": {"$ne": False}}))
    for product in products:
        product["_id"] = str(product["_id"])

    return jsonify({
        "table": {"_id": str(table["_id"]), "table_name": table.get("table_name", "")},
        "products": products,
    }), 200


@customer_bp.route("/customer/orders/<table_id>", methods=["POST"])
def create_customer_order(table_id):
    _, database, error = _get_tenant_database()
    if error:
        return error

    table = _find_table(database, table_id)
    if table is None:
        return jsonify({"error": "Table not found"}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON order object is required"}), 400

    session_token = data.get("session_token")
    try:
        session_token = str(uuid.UUID(session_token))
    except (ValueError, TypeError, AttributeError):
        return jsonify({"error": "A valid session token is required"}), 400

    raw_items = data.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        return jsonify({"error": "Add at least one item to the order"}), 400

    quantities = {}
    for item in raw_items:
        if not isinstance(item, dict) or not ObjectId.is_valid(item.get("product_id", "")):
            return jsonify({"error": "Each item must include a valid product ID"}), 400
        quantity = item.get("quantity")
        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
            return jsonify({"error": "Item quantities must be positive whole numbers"}), 400
        product_id = item["product_id"]
        quantities[product_id] = quantities.get(product_id, 0) + quantity

    special_instructions = data.get("special_instructions", "")
    if not isinstance(special_instructions, str) or len(special_instructions) > 500:
        return jsonify({"error": "Special instructions must be 500 characters or fewer"}), 400

    product_documents = list(database["products"].find({
        "_id": {"$in": [ObjectId(product_id) for product_id in quantities]},
        "available": {"$ne": False},
    }))
    products_by_id = {str(product["_id"]): product for product in product_documents}
    if len(products_by_id) != len(quantities):
        return jsonify({"error": "One or more selected products are unavailable"}), 400

    items = []
    total = 0
    for product_id, quantity in quantities.items():
        product = products_by_id[product_id]
        price = product.get("price")
        if (
            isinstance(price, bool)
            or not isinstance(price, (int, float))
            or (isinstance(price, float) and not math.isfinite(price))
            or price < 0
        ):
            return jsonify({"error": f"Product {product.get('name', product_id)} has an invalid price"}), 400

        items.append({
            "product_id": product_id,
            "name": product.get("name", ""),
            "price": price,
            "quantity": quantity,
        })
        total += price * quantity
        if not math.isfinite(total):
            return jsonify({"error": "Order total is too large"}), 400

    sequence_table = database["tables"].find_one_and_update(
        {"_id": table["_id"]},
        {"$inc": {"customer_sequence": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if sequence_table is None:
        return jsonify({"error": "Table not found"}), 404

    now = datetime.now(timezone.utc)
    raw_table_name = sequence_table.get("table_name")
    table_name = raw_table_name.strip() if isinstance(raw_table_name, str) else "Table"
    table_name = table_name or "Table"
    order = {
        "session_token": session_token,
        "table_name": str(table["_id"]),
        "customer_number": f"{table_name}-{sequence_table['customer_sequence']}",
        "items": items,
        "total": float(total),
        "special_instructions": special_instructions.strip(),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    result = database["orders"].insert_one(order)
    order["_id"] = str(result.inserted_id)
    return jsonify(order), 201

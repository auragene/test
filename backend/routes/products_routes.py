from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from database.db import client
import math
from pymongo import ReturnDocument


products_bp = Blueprint('products', __name__)


def _validate_product_updates(data):
    if not isinstance(data, dict) or not data:
        return None, "A non-empty JSON product object is required"

    editable_fields = {
        "name",
        "description",
        "category",
        "price",
        "image_url",
        "ingredients",
        "prep_time",
        "special_notes",
        "available",
    }
    unknown_fields = set(data) - editable_fields
    if unknown_fields:
        return None, f"Unsupported product fields: {', '.join(sorted(unknown_fields))}"

    updates = dict(data)
    for field in ("name", "description", "category"):
        if field in updates:
            if not isinstance(updates[field], str) or not updates[field].strip():
                return None, f"{field.capitalize()} cannot be empty"
            updates[field] = updates[field].strip()

    if "price" in updates:
        price = updates["price"]
        if (
            isinstance(price, bool)
            or not isinstance(price, (int, float))
            or (isinstance(price, float) and not math.isfinite(price))
            or price < 0
        ):
            return None, "Price must be a non-negative number"

    if "ingredients" in updates and (
        not isinstance(updates["ingredients"], list)
        or any(not isinstance(ingredient, str) for ingredient in updates["ingredients"])
    ):
        return None, "Ingredients must be a list of strings"

    if "available" in updates and not isinstance(updates["available"], bool):
        return None, "Available must be true or false"

    for field in ("image_url", "prep_time", "special_notes"):
        if field in updates and not isinstance(updates[field], str):
            return None, f"{field.replace('_', ' ').capitalize()} must be a string"

    return updates, None


@products_bp.route('/get-products', methods=['GET'])
def get_products():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    products_collection = client[database_name]["products"]
    products = list(products_collection.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products), 200

@products_bp.route('/create-product', methods=['POST'])
def create_product():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON product object is required"}), 400

    required_text_fields = ("name", "description", "category")
    for field in required_text_fields:
        if not isinstance(data.get(field), str) or not data[field].strip():
            return jsonify({"error": f"{field.capitalize()} is required"}), 400

    price = data.get("price")
    if (
        isinstance(price, bool)
        or not isinstance(price, (int, float))
        or (isinstance(price, float) and not math.isfinite(price))
        or price < 0
    ):
        return jsonify({"error": "Price must be a non-negative number"}), 400

    ingredients = data.get("ingredients", [])
    if not isinstance(ingredients, list) or any(
        not isinstance(ingredient, str) for ingredient in ingredients
    ):
        return jsonify({"error": "Ingredients must be a list of strings"}), 400

    available = data.get("available", True)
    if not isinstance(available, bool):
        return jsonify({"error": "Available must be true or false"}), 400

    product = {
        key: value
        for key, value in data.items()
        if key != "_id"
    }
    for field in required_text_fields:
        product[field] = data[field].strip()
    product["price"] = price
    product["ingredients"] = ingredients
    product["available"] = available

    products_collection = client[database_name]["products"]
    result = products_collection.insert_one(product)
    product["_id"] = str(result.inserted_id)
    return jsonify(product), 201


@products_bp.route('/edit-product/<product_id>', methods=['PATCH', 'PUT'])
def edit_product(product_id):
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(product_id):
        return jsonify({"error": "Invalid product ID"}), 400

    updates, error = _validate_product_updates(request.get_json(silent=True))
    if error:
        return jsonify({"error": error}), 400

    product = client[database_name]["products"].find_one_and_update(
        {"_id": ObjectId(product_id)},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if product is None:
        return jsonify({"error": "Product not found"}), 404

    product["_id"] = str(product["_id"])
    return jsonify(product), 200


@products_bp.route('/delete-product/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(product_id):
        return jsonify({"error": "Invalid product ID"}), 400

    result = client[database_name]["products"].delete_one(
        {"_id": ObjectId(product_id)}
    )
    if result.deleted_count == 0:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({"message": "Product deleted", "id": product_id}), 200
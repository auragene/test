from flask import Blueprint, request, jsonify, session
from database.db import client
import math


products_bp = Blueprint('products', __name__)

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
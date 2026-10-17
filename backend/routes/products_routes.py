from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from database.db import client


products_bp = Blueprint('products', __name__)

@products_bp.route('/get-products', methods=['GET'])
def get_products():
    database_name = session.get("database_name")
    products_collection = client[database_name]["products"]
    products = list(products_collection.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products), 200

@products_bp.route('/create-product', methods=['POST'])
def create_product():
    database_name = session.get("database_name")
    products_collection = client[database_name]["products"]
    data = request.get_json()
    result = products_collection.insert_one(data)
    data['_id'] = str(result.inserted_id)
    return jsonify(data), 201
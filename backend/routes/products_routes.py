from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import products_collection

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    products = list(products_collection.find())
    for product in products:
        product['_id'] = str(product['_id'])
    return jsonify(products), 200

@products_bp.route('/products', methods=['POST'])
def create_product():
    data = request.get_json()
    result = products_collection.insert_one(data)
    data['_id'] = str(result.inserted_id)
    return jsonify(data), 201
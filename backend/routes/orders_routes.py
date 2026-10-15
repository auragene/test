from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import orders_collection

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    result = orders_collection.insert_one(data)
    return jsonify({"message": "Order created", "id": str(result.inserted_id)}), 201

@orders_bp.route('/orders', methods=['GET'])
def get_orders():
    orders = list(orders_collection.find())
    for order in orders:
        order['_id'] = str(order['_id'])
    return jsonify(orders), 200
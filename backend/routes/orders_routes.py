from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from database.db import client

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/get-orders', methods=['GET'])
def get_orders():
    database_name = session.get("database_name")
    orders_collection = client[database_name]["orders"]
    orders = list(orders_collection.find())
    for order in orders:
        order['_id'] = str(order['_id'])
    return jsonify(orders), 200
    
@orders_bp.route('/create-order', methods=['POST'])
def create_order():
    database_name = session.get("database_name")
    orders_collection = client[database_name]["orders"]
    data = request.get_json()
    result = orders_collection.insert_one(data)
    return jsonify({"message": "Order created", "id": str(result.inserted_id)}), 201


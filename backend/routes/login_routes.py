from flask import Blueprint, request, jsonify
from bson import ObjectId
from database.db import hotel_staffs_collection

hotel_staff_bp = Blueprint('hotel_staff', __name__)

@hotel_staff_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    result = hotel_staffs_collection.find_one(data)
    if result:
        return jsonify({"message": "Login successful", "id": str(result['_id'])}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401
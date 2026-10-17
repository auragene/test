from bson import ObjectId
from flask import Blueprint, jsonify, request, session
from database.db import client
from pymongo import ReturnDocument

tables_bp = Blueprint('tables', __name__)


@tables_bp.route('/get-tables', methods=['GET'])
def get_tables():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    tables_collection = client[database_name]["tables"]
    tables_list = list(tables_collection.find({}))
    for table in tables_list:
        table["_id"] = str(table["_id"])
    return jsonify(tables_list), 200


@tables_bp.route('/create-table', methods=['POST'])
def create_table():
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON table object is required"}), 400

    table_name = data.get("table_name")
    if not isinstance(table_name, str) or not table_name.strip():
        return jsonify({"error": "Table name is required"}), 400

    table = {"table_name": table_name.strip()}
    result = client[database_name]["tables"].insert_one(table)
    table["_id"] = str(result.inserted_id)
    return jsonify(table), 201


@tables_bp.route('/edit-table/<table_id>', methods=['PATCH', 'PUT'])
def edit_table(table_id):
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(table_id):
        return jsonify({"error": "Invalid table ID"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or set(data) != {"table_name"}:
        return jsonify({"error": "Only the table_name field can be updated"}), 400

    table_name = data["table_name"]
    if not isinstance(table_name, str) or not table_name.strip():
        return jsonify({"error": "Table name is required"}), 400

    table = client[database_name]["tables"].find_one_and_update(
        {"_id": ObjectId(table_id)},
        {"$set": {"table_name": table_name.strip()}},
        return_document=ReturnDocument.AFTER,
    )
    if table is None:
        return jsonify({"error": "Table not found"}), 404

    table["_id"] = str(table["_id"])
    return jsonify(table), 200


@tables_bp.route('/delete-table/<table_id>', methods=['DELETE'])
def delete_table(table_id):
    database_name = session.get("database_name")
    if not database_name:
        return jsonify({"error": "Authentication required"}), 401

    if not ObjectId.is_valid(table_id):
        return jsonify({"error": "Invalid table ID"}), 400

    result = client[database_name]["tables"].delete_one(
        {"_id": ObjectId(table_id)}
    )
    if result.deleted_count == 0:
        return jsonify({"error": "Table not found"}), 404

    return jsonify({"message": "Table deleted", "id": table_id}), 200
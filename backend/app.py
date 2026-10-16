from flask import Flask
from flask_cors import CORS
from routes.login_routes import hotel_staff_bp
from routes.products_routes import products_bp
from routes.orders_routes import orders_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(hotel_staff_bp)
app.register_blueprint(products_bp)
app.register_blueprint(orders_bp)

if __name__ == "__main__":
    app.run(debug=True)
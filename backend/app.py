from flask import Flask
from flask_cors import CORS
from routes.login_routes import hotel_staff_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(hotel_staff_bp)


if __name__ == "__main__":
    app.run(debug=True)
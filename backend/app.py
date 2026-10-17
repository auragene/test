import os
from datetime import timedelta

from flask import Flask
from flask_cors import CORS
from flask_session import Session

from routes.login_routes import login_bp
from routes.orders_routes import orders_bp
from routes.products_routes import products_bp
from routes.setttings_routes import settings_bp
from routes.tables_routes import tables_bp

app = Flask(__name__)
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
CORS(app, origins=frontend_origins, supports_credentials=True)


app.config["SECRET_KEY"] = "your-long-random-secret-key"
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = os.getenv("SESSION_COOKIE_SECURE", "true").lower() == "true"
app.config["SESSION_COOKIE_SAMESITE"] = "None"

Session(app)
app.register_blueprint(login_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(products_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(tables_bp)

if __name__ == "__main__":
    app.run(debug=True)
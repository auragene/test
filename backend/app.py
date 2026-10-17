from flask import Flask
from flask_cors import CORS
from flask_session import Session
from datetime import timedelta
from routes.login_routes import login_bp
from routes.orders_routes import orders_bp
from routes.products_routes import products_bp

app = Flask(__name__)
CORS(app)


app.config["SECRET_KEY"] = "your-long-random-secret-key"
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = True  # HTTPS in production
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

Session(app)
app.register_blueprint(login_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(products_bp)


if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask
from flask_cors import CORS
from models import db
from routes import register_routes
import logging

def create_app():
    app = Flask(__name__, static_folder='static')
    CORS(app)

    # Setup logging
    logging.basicConfig(level=logging.INFO)
    app.logger = logging.getLogger(__name__)

    # Load admin code from config
    from config import ADMIN_CODE
    app.config['ADMIN_CODE'] = ADMIN_CODE

    # Setup logging for admin access attempts
    app.logger.info(f"Admin code loaded: {app.config['ADMIN_CODE']}")

    # Configure SQLite database
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///messages.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize database
    db.init_app(app)

    with app.app_context():
        db.create_all()

    # Register routes
    register_routes(app, db)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', port=8080, debug=True)

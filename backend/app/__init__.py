# backend/app/__init__.py
from flask import Flask, g, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import timedelta
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
bcrypt = Bcrypt()

def create_app():
    """Application factory pattern for Flask app creation"""
    app = Flask(__name__)

    # --- START ADDITION ---
    # Stripe Configuration - Load from environment variables
    app.config['STRIPE_SECRET_KEY'] = os.getenv('STRIPE_SECRET_KEY')
    app.config['STRIPE_PUBLISHABLE_KEY'] = os.getenv('STRIPE_PUBLISHABLE_KEY') # Also load publishable key if needed elsewhere
    app.config['STRIPE_WEBHOOK_SECRET'] = os.getenv('STRIPE_WEBHOOK_SECRET') # Load webhook secret
    # --- END ADDITION ---

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=10)
    # ... (rest of the config remains the same) ...

    # Database configuration
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '3306')
    db_name = os.getenv('DB_NAME', 'resume_ai_db')

    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # IMPORTANT: Configure CORS properly for credentials
    frontend_origin = 'https://frontend-production-d76f.up.railway.app'
    CORS(app, 
     resources={r"/api/*": {"origins": [
         "https://frontend-production-d76f.up.railway.app",
         "https://www.instantresumeai.com"
     ]}},
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         # --- THIS IS THE FIX FOR DOWNLOADING ---
        expose_headers=["Content-Disposition"]
    )

    from app.models.user import User
    from app.models.api_log import ApiLog

    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        # --- DEBUGGING START ---
        print(f"--- DEBUG: Checking claims for identity: {identity} (type: {type(identity)}) ---")
        try:
            user = User.query.get(int(identity))
            if user:
                print(f"--- DEBUG: Found user '{user.username}', is_admin status: {user.is_admin} ---")
                if user.is_admin:
                    print(f"--- DEBUG: Returning {{'is_admin': True}} ---")
                    return {'is_admin': True}
            else:
                print(f"--- DEBUG: User not found for identity: {identity} ---")
        except Exception as e:
            print(f"--- DEBUG: Error during user lookup: {e} ---")

        print(f"--- DEBUG: Returning {{'is_admin': False}} ---")
        # --- DEBUGGING END ---
        return {'is_admin': False}

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.resume import resume_bp
    from app.routes.contact import contact_bp
    from app.routes.admin import admin_bp
    from app.routes.billing import billing_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(billing_bp, url_prefix='/api/billing')

    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token', 'error': str(error)}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired'}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Authorization token is missing'}, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has been revoked'}, 401

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        # Replace this with your actual revoked token checking logic
        return False

    # Request logging logic
    @app.before_request
    def start_timer():
        if request.path.startswith('/api/'):
            g.start_time = time.time()

    @app.after_request
    def log_request(response):
        if hasattr(g, 'start_time'):
            response_time_ms = (time.time() - g.start_time) * 1000

            # Exclude webhook endpoint from logging detailed response time
            if request.path == '/api/billing/webhook':
                response_time_ms = 0 # Or some placeholder if needed

            api_log_entry = ApiLog(
                endpoint=request.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )

            with app.app_context():
                db.session.add(api_log_entry)
                db.session.commit()

        return response

    return app
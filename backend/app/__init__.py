# backend/app/__init__.py
# --- COMPLETE RECTIFIED FILE ---

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
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['STRIPE_SECRET_KEY'] = os.getenv('STRIPE_SECRET_KEY')
    app.config['STRIPE_WEBHOOK_SECRET'] = os.getenv('STRIPE_WEBHOOK_SECRET')

    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'
    
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    
    # --- THIS IS THE FIX FOR THE CORS ERROR ---
    # Tell flask-jwt-extended to let OPTIONS requests pass through
    # without a token, so flask-cors can handle them.
    app.config['JWT_SKIP_OPTIONS_REQUESTS'] = True
    # --- END OF FIX ---
    
    # Database configuration
    db_user = os.getenv('DB_USER', 'adithya')
    db_password = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = 5432
    db_name = os.getenv('DB_NAME', 'resume_ai_db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    CORS(app, 
         resources={r"/api/*": {"origins": "http://localhost:3000"}},
         supports_credentials=True,
         # --- ADD 'Accept' TO ALLOW_HEADERS ---
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         # --- THIS IS THE FIX FOR DOWNLOADING ---
         expose_headers=["Content-Disposition"]
         # --- END OF FIX ---
    )
    
    from app.models.user import User
    from app.models.api_log import ApiLog

    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        user = User.query.get(int(identity))
        if user and user.is_admin:
            return {'is_admin': True}
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
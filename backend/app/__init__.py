# backend/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import timedelta
import os
from dotenv import load_dotenv

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
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # IMPORTANT: Add these JWT configurations
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'message'
    
    # Ensure JWT doesn't check for CSRF tokens
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    
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
    frontend_origin = 'https://frontend-production-6ff2.up.railway.app'
    CORS(app, 
     resources={r"/api/*": {"origins": [frontend_origin]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.resume import resume_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    
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
    
    # IMPORTANT: Add this to handle token in header properly
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has been revoked'}, 401
    # Add this function to handle token extraction
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return False  # For now, don't check revocation

    # Add explicit token verification
    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        return {'user_id': identity}
    
   
    
    return app
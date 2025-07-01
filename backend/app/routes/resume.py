# backend/app/routes/resume.py (Final Simplified Version)

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import uuid
import re
from datetime import datetime

# Make sure to import the necessary libraries and modules
import docx
from app import db
from app.models.user import User
from app.models.activity import ActivityLog
from app.services.comprehensive_resume_processor import IntegratedResumeService
from app.services.enhancement_validator import EnhancementValidator

resume_bp = Blueprint('resume', __name__)

# Configure upload settings - DOCX only
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
ALLOWED_EXTENSIONS = {'docx'}  # Only DOCX files are allowed
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'resumes'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'enhanced'), exist_ok=True)

# --- Helper Functions ---

def allowed_file(filename):
    """Checks if the file has a .docx extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    """Validates the file size against the MAX_FILE_SIZE."""
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    return file_size <= MAX_FILE_SIZE

def get_text_from_docx(filepath):
    """Extracts plain text from a DOCX file for validation purposes."""
    try:
        doc = docx.Document(filepath)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    full_text.append(cell.text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
        return ""

# --- Main Enhancement Route ---

@resume_bp.route('/enhance', methods=['POST', 'OPTIONS'])
def enhance_resume():
    if request.method == 'OPTIONS':
        return '', 204
    """Main endpoint for resume enhancement - DOCX files only"""
    print("=== RESUME ENHANCEMENT REQUEST RECEIVED ===")

    # 1. AUTHENTICATION AND USER VALIDATION
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Authorization token is missing or invalid'}), 401
    
    try:
        from flask_jwt_extended import decode_token
        token = auth_header.replace('Bearer ', '', 1)
        decoded_token = decode_token(token)
        user_id_from_token = int(decoded_token['sub'])
        
        user = User.query.get(user_id_from_token)
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or is inactive'}), 401
        print(f"User validated: {user.username} (ID: {user_id_from_token})")

    except Exception as e:
        return jsonify({'message': f'Token validation failed: {str(e)}'}), 401

    # 2. FILE AND FORM DATA VALIDATION
    if 'resume' not in request.files or 'job_description' not in request.form:
        return jsonify({'message': 'Resume file (.docx) and job description are required'}), 400
    
    resume_file = request.files['resume']
    job_description = request.form.get('job_description', '').strip()
    
    if resume_file.filename == '':
        return jsonify({'message': 'No resume file selected'}), 400
    
    if not allowed_file(resume_file.filename):
        return jsonify({'message': 'Invalid file format. Only DOCX files are accepted'}), 400
    
    if not validate_file_size(resume_file):
        return jsonify({'message': 'File size exceeds 10MB limit'}), 400
        
    if len(job_description) < 50:
        return jsonify({'message': 'Job description must be at least 50 characters long'}), 400

    # 3. SAVE UPLOADED FILE
    try:
        filename = secure_filename(resume_file.filename)
        unique_id = str(uuid.uuid4())
        file_extension = filename.rsplit('.', 1)[1].lower()
        saved_filename = f"{unique_id}.{file_extension}"
        filepath = os.path.join(UPLOAD_FOLDER, 'resumes', saved_filename)
        
        resume_file.save(filepath)
        print(f"File saved to: {filepath}")
    except Exception as e:
        return jsonify({'message': 'Failed to save uploaded file', 'error': str(e)}), 500

    # 4. CORE ENHANCEMENT AND VALIDATION LOGIC
    print("=== STARTING BATCH RESUME ENHANCEMENT ===")
    try:
        # A. ENHANCE THE RESUME
        enhancement_service = IntegratedResumeService()
        
        enhanced_filename = f"enhanced_{unique_id}.docx"
        enhanced_filepath = os.path.join(UPLOAD_FOLDER, 'enhanced', enhanced_filename)
        
        processing_result = enhancement_service.enhance_resume(
            original_file_path=filepath,
            job_description=job_description,
            output_path=enhanced_filepath
        )
        
        if not processing_result.get('success'):
            error_detail = processing_result.get('error', 'Unknown processing error')
            print(f"Enhancement failed: {error_detail}")
            return jsonify({'message': 'Failed to enhance resume.', 'error': error_detail}), 500

        print("Batch enhancement completed successfully.")
        
        # B. VALIDATE THE ENHANCEMENT (QA CHECK)
        print("--- Starting Quality Assurance Validation ---")
        validator = EnhancementValidator()
        
        original_text = get_text_from_docx(filepath)
        enhanced_text = get_text_from_docx(enhanced_filepath)
        
        validation_results = validator.validate_enhancement(
            original_text=original_text,
            enhanced_text=enhanced_text,
            job_description=job_description
        )
        
        print(f"Validation Complete. Overall Score: {validation_results['overall_score']:.2f}")
        if validation_results['issues_found']:
            print(f"Validation Issues Found: {validation_results['issues_found']}")
            
        # C. LOG ACTIVITY AND PREPARE RESPONSE
        final_file_size = os.path.getsize(enhanced_filepath)
        
        try:
            activity_log = ActivityLog(
                user_id=user_id_from_token,
                action='resume_enhanced',
                description='Resume enhanced successfully with format preservation.',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent'),
                activity_metadata={
                    'original_file': saved_filename,
                    'enhanced_file': enhanced_filename,
                    'file_size': final_file_size,
                    'validation_score': validation_results['overall_score']
                }
            )
            db.session.add(activity_log)
            db.session.commit()
        except Exception as log_error:
            print(f"Activity logging failed: {str(log_error)}")

        # D. SEND SUCCESS RESPONSE
        return jsonify({
            'message': 'Resume enhanced successfully while preserving original format.',
            'enhanced_resume_id': unique_id,
            'file_format': 'docx',
            'file_size': final_file_size,
            'quality_assessment': {
                'score': validation_results['overall_score'],
                'issues': validation_results['issues_found']
            }
        }), 200

    except Exception as e:
        import traceback
        print(f"A critical error occurred in the enhancement process: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'message': 'An unexpected server error occurred during resume enhancement.',
            'error': str(e)
        }), 500

# --- Download Route ---

@resume_bp.route('/download/<resume_id>', methods=['GET'])
def download_enhanced_resume(resume_id):
    """Download the enhanced resume using its unique ID."""
    print(f"Download request received for ID: {resume_id}")
    
    # AUTHENTICATION
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Authorization token is missing or invalid'}), 401
    
    try:
        from flask_jwt_extended import decode_token
        token = auth_header.replace('Bearer ', '', 1)
        decode_token(token) # Just validating the token is enough for download
    except Exception as e:
        return jsonify({'message': f'Token validation failed: {str(e)}'}), 401
        
    # Validate resume_id format (basic check)
    if not re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', resume_id):
        return jsonify({'message': 'Invalid resume ID format'}), 400
    
    # Construct filepath
    enhanced_filename = f"enhanced_{resume_id}.docx"
    filepath = os.path.join(UPLOAD_FOLDER, 'enhanced', enhanced_filename)
    
    if not os.path.exists(filepath):
        print(f"ERROR: File not found at {filepath}")
        return jsonify({'message': 'Enhanced resume not found'}), 404
        
    download_name = f'InstantResumeAI_Enhanced_{datetime.now().strftime("%Y%m%d")}.docx'
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=download_name,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
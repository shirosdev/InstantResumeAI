# backend/app/routes/resume.py

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import uuid
import re
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

# Make sure to import the necessary libraries and modules
import docx
from app import db
from app.models.user import User
from app.models.activity import ActivityLog
from app.services.comprehensive_resume_processor import IntegratedResumeService
from app.services.enhancement_validator import EnhancementValidator
from app.models.resume import ResumeEnhancement

resume_bp = Blueprint('resume', __name__)

# Configure upload settings - DOCX only
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads')
ALLOWED_EXTENSIONS = {'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'resumes'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'enhanced'), exist_ok=True)

# --- Helper Functions (No Changes Here) ---

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    return file_size <= MAX_FILE_SIZE

def get_text_from_docx(filepath):
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

@resume_bp.route('/enhance', methods=['POST'])
@jwt_required()
def enhance_resume():
    user_id_from_token = get_jwt_identity()
    user = User.query.get(user_id_from_token)
    if not user or not user.is_active:
        return jsonify({'message': 'User not found or is inactive'}), 401

    if 'resume' not in request.files or 'job_description' not in request.form:
        return jsonify({'message': 'Resume file (.docx) and job description are required'}), 400
    
    resume_file = request.files['resume']
    job_description = request.form.get('job_description', '').strip()
    
    if not resume_file.filename or not allowed_file(resume_file.filename) or not validate_file_size(resume_file) or len(job_description) < 50:
        return jsonify({'message': 'Invalid input. Please check file type, size, and job description.'}), 400

    user_facing_filename = secure_filename(resume_file.filename)
    unique_id = str(uuid.uuid4())
    internal_filename = f"{unique_id}.docx"
    filepath = os.path.join(UPLOAD_FOLDER, 'resumes', internal_filename)
    
    try:
        resume_file.save(filepath)
    except Exception as e:
        return jsonify({'message': 'Failed to save uploaded file', 'error': str(e)}), 500

    try:
        enhancement_service = IntegratedResumeService()
        enhanced_filename = f"enhanced_{unique_id}.docx"
        enhanced_filepath = os.path.join(UPLOAD_FOLDER, 'enhanced', enhanced_filename)
        
        processing_result = enhancement_service.enhance_resume(
            original_file_path=filepath,
            job_description=job_description,
            output_path=enhanced_filepath
        )
        if not processing_result.get('success'):
            # If enhancement fails, clean up the original uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
            error_detail = processing_result.get('error', 'Unknown processing error')
            return jsonify({'message': 'Failed to enhance resume.', 'error': error_detail}), 500

        validator = EnhancementValidator()
        original_text = get_text_from_docx(filepath)
        enhanced_text = get_text_from_docx(enhanced_filepath)
        validation_results = validator.validate_enhancement(
            original_text=original_text,
            enhanced_text=enhanced_text,
            job_description=job_description
        )
        
        final_file_size = os.path.getsize(enhanced_filepath)
        
        new_enhancement = ResumeEnhancement(
            user_id=user_id_from_token,
            original_filename=user_facing_filename,
            enhanced_filename=enhanced_filename,
            file_path=os.path.join('enhanced', enhanced_filename),
            enhancement_status='completed',
            job_description_snippet=job_description[:500],
            created_at=datetime.utcnow(),  # Explicitly set to ensure UTC consistency
            completed_at=datetime.utcnow()
        )
        db.session.add(new_enhancement)
        db.session.commit()

        # --- CORRECTED CLEANUP LOGIC ---
        # Query for all records for the user, sorted with the oldest first
        all_enhancements = ResumeEnhancement.query.filter_by(user_id=user_id_from_token).order_by(ResumeEnhancement.created_at.asc()).all()
        
        if len(all_enhancements) > 5:
            # Identify the records and files to delete (all except the last 5)
            records_to_delete = all_enhancements[:-5]
            for record in records_to_delete:
                # Delete associated files
                old_enhanced_file = os.path.join(UPLOAD_FOLDER, 'enhanced', record.enhanced_filename)
                old_original_file_id = record.enhanced_filename.replace('enhanced_', '').replace('.docx', '')
                old_original_file = os.path.join(UPLOAD_FOLDER, 'resumes', f"{old_original_file_id}.docx")
                
                if os.path.exists(old_enhanced_file):
                    os.remove(old_enhanced_file)
                if os.path.exists(old_original_file):
                    os.remove(old_original_file)
                
                # Delete the database record
                db.session.delete(record)
            
            db.session.commit()
            print(f"Trimmed {len(records_to_delete)} old enhancement records and files for user {user_id_from_token}.")
        # --------------------------------

        return jsonify({
            'message': 'Resume enhanced successfully.',
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
        db.session.rollback()
        print(f"A critical error occurred: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'message': 'An unexpected server error occurred.', 'error': str(e)}), 500

# --- History and Download Routes (No Changes Here) ---

@resume_bp.route('/history', methods=['GET'])
@jwt_required()
def get_enhancement_history():
    try:
        current_user_id = get_jwt_identity()
        history_records = ResumeEnhancement.query.filter_by(user_id=current_user_id)\
            .order_by(ResumeEnhancement.created_at.desc())\
            .limit(5).all()
        history_list = [record.to_dict() for record in history_records]
        return jsonify(history_list), 200
    except Exception as e:
        print(f"Error fetching history: {str(e)}")
        return jsonify({'message': 'Failed to retrieve enhancement history.'}), 500

@resume_bp.route('/download/<resume_id>', methods=['GET'])
@jwt_required()
def download_enhanced_resume(resume_id):
    if not re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', resume_id):
        return jsonify({'message': 'Invalid resume ID format'}), 400
    
    enhanced_filename = f"enhanced_{resume_id}.docx"
    filepath = os.path.join(UPLOAD_FOLDER, 'enhanced', enhanced_filename)
    
    if not os.path.exists(filepath):
        return jsonify({'message': 'File not found. This download link may have expired as we only keep the last 5 records.'}), 404
        
    download_name = f'InstantResumeAI_Enhanced_{datetime.now().strftime("%Y%m%d")}.docx'
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=download_name,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
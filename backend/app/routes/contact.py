# backend/app/routes/contact.py

from flask import Blueprint, request, jsonify
from app import db
from app.services.email_service import EmailService
from app.models.support_ticket import SupportTicket # Import the new model
from app.models.user import User # Import User to link tickets

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/send', methods=['POST'])
def send_contact_message():
    """Handles contact form submissions by sending an email and creating a support ticket."""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        user_email = data.get('email', '').strip().lower()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()

        if not all([name, user_email, subject, message]):
            return jsonify({'message': 'All fields are required.'}), 400

        # --- New Logic: Save as a support ticket ---
        # Check if the email corresponds to a registered user
        user = User.query.filter_by(email=user_email).first()
        user_id = user.user_id if user else None

        new_ticket = SupportTicket(
            name=name,
            email=user_email,
            subject=subject,
            message=message,
            user_id=user_id
        )
        db.session.add(new_ticket)
        # --- End of New Logic ---
        
        # We can still send the email notification
        email_service = EmailService()
        email_service.send_contact_inquiry(
            from_name=name,
            from_email=user_email,
            subject=subject,
            message_body=message
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Your message has been sent successfully! We will get back to you shortly.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Contact form submission error: {e}") 
        return jsonify({'message': 'An unexpected error occurred on our end.'}), 500
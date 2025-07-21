# backend/app/routes/contact.py

from flask import Blueprint, request, jsonify
from app.services.email_service import EmailService

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/send', methods=['POST'])
def send_contact_message():
    """Handles contact form submissions by sending an email to the default company address."""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        user_email = data.get('email', '').strip().lower()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()

        if not all([name, user_email, subject, message]):
            return jsonify({'message': 'All fields are required.'}), 400

        email_service = EmailService()

        # Call the new, specific method in your email service
        success = email_service.send_contact_inquiry(
            from_name=name,
            from_email=user_email,
            subject=subject,
            message_body=message
        )

        if not success:
            return jsonify({'message': 'Sorry, the message could not be sent at this time. Please try again later.'}), 500
        
        return jsonify({
            'message': 'Your message has been sent successfully! We will get back to you shortly.'
        }), 200

    except Exception as e:
        print(f"Contact form submission error: {e}") 
        return jsonify({'message': 'An unexpected error occurred on our end.'}), 500
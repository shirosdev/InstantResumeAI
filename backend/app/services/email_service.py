# backend/app/services/email_service.py
# --- UPDATED TO ADD SUBSCRIPTION INVOICE EMAIL ---

import requests
import os
from email.utils import formataddr
from datetime import datetime
import logging
from app.pdf_service import PDFService

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails via Mailgun API"""
    
    def __init__(self):
        self.mailgun_domain = os.getenv('MAILGUN_DOMAIN')
        self.mailgun_api_key = os.getenv('MAILGUN_API_KEY')
        self.from_email = os.getenv('FROM_EMAIL', f'noreply@{self.mailgun_domain}')
        self.from_name = os.getenv('FROM_NAME', 'InstantResumeAI')
        self.admin_email = os.getenv('ADMIN_EMAIL', 'info@instantresumeai.com')
        self.api_base_url = f"https://api.mailgun.net/v3/{self.mailgun_domain}"

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Sends a welcome email to a new user upon registration."""
        try:
            subject = "Welcome to InstantResumeAI!"
            html_content = self._create_welcome_html(user_name, to_email)
            text_content = self._create_welcome_text(user_name, to_email)
            return self._send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
            return False

    def send_broadcast_email(self, to_email: str, user_name: str, subject: str, html_message: str) -> bool:
        """Sends a generic broadcast email to a user."""
        try:
            full_html_content = f"""
            <p>Hi {user_name},</p>
            {html_message}
            <br>
            <p>Best regards,<br>The InstantResumeAI Team</p>
            """
            text_content = f"Hi {user_name},\n\n{html_message.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n')}\n\nBest regards,\nThe InstantResumeAI Team"

            return self._send_email(
                to_email=to_email,
                subject=subject,
                html_content=full_html_content,
                text_content=text_content
            )
        except Exception as e:
            logger.error(f"Failed to send BROADCAST email to {to_email}: {str(e)}")
            return False

    def send_payment_receipt_email(self, user, payment_details) -> bool:
        """Generates a PDF receipt (for top-ups) and sends it as an email attachment."""
        pdf_path = None
        try:
            pdf_service = PDFService()
            pdf_path = pdf_service.create_invoice_pdf(user, payment_details)
            
            subject = f"Your InstantResumeAI Receipt ({payment_details['payment_intent_id'][-6:]})"
            html_content = self._create_receipt_html(user.first_name or user.username, payment_details)
            text_content = self._create_receipt_text(user.first_name or user.username, payment_details)

            success = self._send_email(
                to_email=user.email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                attachment_path=pdf_path
            )
            return success
        except Exception as e:
            logger.error(f"Failed to send payment receipt to {user.email}: {str(e)}")
            return False
        finally:
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)

    # --- NEW METHOD FOR SUBSCRIPTION INVOICES ---
    def send_subscription_invoice_email(self, user, plan, transaction) -> bool:
        """Generates a PDF invoice for a subscription and sends it."""
        pdf_path = None
        try:
            # 1. Generate the PDF using the correct service method
            pdf_service = PDFService()
            pdf_path = pdf_service.create_subscription_invoice(user, plan, transaction)
            
            # 2. Prepare Email Content
            subject = f"Your InstantResumeAI Invoice (Plan: {plan.plan_name})"
            html_content = self._create_subscription_html(user.first_name or user.username, plan, transaction)
            text_content = self._create_subscription_text(user.first_name or user.username, plan, transaction)

            # 3. Send the email with the PDF attachment
            success = self._send_email(
                to_email=user.email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                attachment_path=pdf_path
            )
            return success
        except Exception as e:
            logger.error(f"Failed to send subscription invoice to {user.email}: {str(e)}")
            return False
        finally:
            # 4. Clean up the temporary PDF file
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)

    def _create_receipt_html(self, user_name: str, payment_details: dict) -> str:
        return f"""
        <p>Hi {user_name},</p>
        <p>Thank you for your purchase. Your receipt is attached to this email as a PDF.</p>
        <p><b>Summary:</b><br>
        Item: {payment_details['credits_purchased']} x Enhancement Credits<br>
        Total Paid: ${payment_details['amount_paid']:.2f} USD<br>
        Transaction ID: {payment_details['payment_intent_id']}</p>
        <p>Your new credit balance is now available on your dashboard.</p>
        """

    def _create_receipt_text(self, user_name: str, payment_details: dict) -> str:
        return f"""
        Hi {user_name},\n
        Thank you for your purchase. Your receipt is attached.\n
        Summary:\n
        - Item: {payment_details['credits_purchased']} x Enhancement Credits\n
        - Total Paid: ${payment_details['amount_paid']:.2f} USD\n
        - Transaction ID: {payment_details['payment_intent_id']}
        """

    # --- NEW HELPER METHODS FOR SUBSCRIPTION EMAIL ---
    def _create_subscription_html(self, user_name: str, plan, transaction) -> str:
        return f"""
        <p>Hi {user_name},</p>
        <p>Thank you for subscribing to the <strong>{plan.plan_name}</strong> plan. Your invoice is attached as a PDF.</p>
        <p><b>Summary:</b><br>
        Item: {plan.plan_name} Plan<br>
        Total Paid: ${transaction.amount:.2f} USD<br>
        Transaction ID: {transaction.payment_gateway_id}</p>
        <p>Your new plan is now active. You can check your status on your dashboard.</p>
        """

    def _create_subscription_text(self, user_name: str, plan, transaction) -> str:
        return f"""
        Hi {user_name},\n
        Thank you for subscribing to the {plan.plan_name} plan. Your invoice is attached as a PDF.\n
        Summary:\n
        - Item: {plan.plan_name} Plan\n
        - Total Paid: ${transaction.amount:.2f} USD\n
        - Transaction ID: {transaction.payment_gateway_id}\n
        Your new plan is now active. You can check your status on your dashboard.
        """
    # --- END NEW HELPER METHODS ---
        
    def send_contact_inquiry(self, from_name: str, from_email: str, subject: str, message_body: str) -> bool:
        """
        Sends the contact form submission. 
        Now correctly uses Mailgun's 'Reply-To' feature.
        """
        try:
            to_email = self.admin_email
            email_subject = f"New Contact Inquiry: {subject}"
            
            html_content = f"""
            <h3>You have a new contact form submission:</h3>
            <p><strong>From:</strong> {from_name}</p>
            <p><strong>Email (Reply-To):</strong> <a href="mailto:{from_email}">{from_email}</a></p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr>
            <h4>Message:</h4>
            <p>{message_body.replace('\n', '<br>')}</p>
            """
            
            text_content = f"""
            You have a new contact form submission:
            
            From: {from_name}
            Email (Reply-To): {from_email}
            Subject: {subject}
            
            Message:
            {message_body}
            """

            return self._send_email(
                to_email=to_email,
                subject=email_subject,
                html_content=html_content,
                text_content=text_content,
                reply_to_email=from_email,
                reply_to_name=from_name
            )
        except Exception as e:
            logger.error(f"Failed to send contact inquiry from {from_email}: {str(e)}")
            return False
    
    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str = None) -> bool:
        """Sends password reset email with verification code"""
        try:
            subject = "Reset Your InstantResumeAI Password"
            html_content = self._create_password_reset_html(reset_token, user_name)
            text_content = self._create_password_reset_text(reset_token, user_name)
            return self._send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
            return False
    
    def send_password_change_confirmation(self, to_email: str, user_name: str = None) -> bool:
        """Sends confirmation email after successful password change"""
        try:
            subject = "Password Changed Successfully - InstantResumeAI"
            html_content = self._create_password_changed_html(user_name)
            text_content = self._create_password_changed_text(user_name)
            return self._send_email(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
        except Exception as e:
            logger.error(f"Failed to send password change confirmation to {to_email}: {str(e)}")
            return False
    
    def _send_email(self, 
                    to_email: str, 
                    subject: str, 
                    html_content: str, 
                    text_content: str, 
                    attachment_path: str = None,
                    reply_to_email: str = None,
                    reply_to_name: str = None) -> bool:
        """
        Sends an email using the Mailgun API.
        """
        if not self.mailgun_api_key or not self.mailgun_domain:
            logger.error("Mailgun credentials (API_KEY, DOMAIN) not configured")
            return False
        
        from_address = formataddr((self.from_name, self.from_email))
        
        data = {
            "from": from_address,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content
        }
        
        if reply_to_email:
            reply_to_name = reply_to_name or reply_to_email
            data["h:Reply-To"] = formataddr((reply_to_name, reply_to_email))
            
        files = None
        if attachment_path and os.path.exists(attachment_path):
            try:
                with open(attachment_path, "rb") as attachment_file:
                    file_data = attachment_file.read()
                    file_name = os.path.basename(attachment_path)
                    files = [("attachment", (file_name, file_data))]
            except Exception as e:
                logger.error(f"Error reading attachment {attachment_path}: {e}")
                return False
        
        try:
            response = requests.post(
                f"{self.api_base_url}/messages",
                auth=("api", self.mailgun_api_key),
                data=data,
                files=files
            )
            
            if response.status_code == 200:
                logger.info(f"Mailgun email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Mailgun error sending to {to_email}. Status: {response.status_code}, Response: {response.text}")
                return False
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Requests error sending to {to_email}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in Mailgun _send_email: {str(e)}")
            return False
            
    # --- HTML/Text creation helpers ---
    
    def _create_welcome_html(self, user_name: str, user_email: str) -> str:
        # This helper function remains unchanged
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to InstantResumeAI</title>
            <style>
                body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #e67e50 0%, #f4a261 100%); color: white; padding: 40px; text-align: center; }}
                .content {{ padding: 30px; }}
                .content p {{ margin-bottom: 20px; color: #555; }}
                ul {{ list-style-type: '✓'; padding-left: 20px; margin-bottom: 20px; }}
                li {{ margin-bottom: 10px; padding-left: 10px; color: #555; }}
                .button-container {{ text-align: center; margin: 30px 0; }}
                .button {{ display: inline-block; background-color: #e67e50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
                .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to InstantResumeAI!</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    <p>You've taken the first step toward making your resume sharper, smarter, and more impactful.</p>
                    <p>With InstantResumeAI, you can:</p>
                    <ul>
                        <li>Enhance your existing resume with AI-driven improvements.</li>
                        <li>Optimize your resume for ATS (Applicant Tracking Systems).</li>
                        <li>Tailor your resume to highlight your skills and achievements effectively.</li>
                        <li>Download a polished version that's recruiter-ready.</li>
                    </ul>
                    <div class="button-container">
                        <a href="http://localhost:3000/dashboard" class="button">🚀 Enhance My Resume Now</a>
                    </div>
                    <p>We're here to make sure your resume doesn't just get noticed — it gets remembered.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                    <p>Best regards,<br>The InstantResumeAI Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent to {user_email}.</p>
                    <p>Need help? Contact us anytime at support@instantresumeai.com</p>
                </div>
            </div>
        </body>
        </html>
        """

    def _create_welcome_text(self, user_name: str, user_email: str) -> str:
        # This helper function remains unchanged
        return f"""
        Hi {user_name},

        Welcome to InstantResumeAI! You've taken the first step toward making your resume sharper, smarter, and more impactful.

        With InstantResumeAI, you can:
        - Enhance your existing resume with AI-driven improvements.
        - Optimize your resume for ATS (Applicant Tracking Systems).
        - Tailor your resume to highlight your skills and achievements effectively.
        - Download a polished version that's recruiter-ready.

        Enhance My Resume Now: http://instantresumeai.com/dashboard

        We're here to make sure your resume doesn't just get noticed — it gets remembered.

        If you didn't create this account, please ignore this email.

        Best regards,
        The InstantResumeAI Team

        ---
        This email was sent to {user_email}.
        Need help? Contact us anytime at support@instantresumeai.com
        """
    
    def _create_password_reset_html(self, reset_token: str, user_name: str = None) -> str:
        # This helper function remains unchanged
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
            <style>
                body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #e67e50 0%, #f4a261 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .code-box {{ background: #1a2332; color: #7dd3c9; font-size: 36px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; letter-spacing: 8px; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 14px; color: #666; }}
                .button {{ display: inline-block; background: #e67e50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                    <p>InstantResumeAI Security Team</p>
                </div>
                <div class="content">
                    <p>{greeting}</p>
                    
                    <p>We received a request to reset your password for your InstantResumeAI account. To proceed with the password reset, please use the verification code below:</p>
                    
                    <div class="code-box">
                        {reset_token}
                    </div>
                    
                    <p><strong>This verification code will expire in 15 minutes</strong> for your security.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        If you did not request this password reset, please ignore this email and your password will remain unchanged. Consider updating your account security if you suspect unauthorized access.
                    </div>
                    
                    <p>If you're having trouble with the password reset process, please contact our support team at info@instantresumeai.com</p>
                    
                    <p>Best regards,<br>
                    The InstantResumeAI Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} InstantResumeAI. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_password_reset_text(self, reset_token: str, user_name: str = None) -> str:
        # This helper function remains unchanged
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        
        return f"""
{greeting}

We received a request to reset your password for your InstantResumeAI account.

Your verification code is: {reset_token}

This code will expire in 15 minutes for your security.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

If you need assistance, contact us at info@instantresumeai.com

Best regards,
The InstantResumeAI Team

© {datetime.now().year} InstantResumeAI. All rights reserved.
        """
    
    def _create_password_changed_html(self, user_name: str = None) -> str:
        # This helper function remains unchanged
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Changed Successfully</title>
            <style>
                body {{ font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success {{ background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 14px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Password Changed Successfully</h1>
                    <p>InstantResumeAI Security Team</p>
                </div>
                <div class="content">
                    <p>{greeting}</p>
                    
                    <div class="success">
                        <strong>✓ Your password has been successfully changed!</strong>
                    </div>
                    
                    <p>Your InstantResumeAI account password was changed on {datetime.now().strftime('%B %d, %Y at %I:%M %p UTC')}.</p>
                    
                    <p>If you did not make this change, please contact our support team immediately at info@instantresumeai.com</p>
                    
                    <p>For your security, we recommend:</p>
                    <ul>
                        <li>Using a strong, unique password</li>
                        <li>Not sharing your password with anyone</li>
                        <li>Logging out of shared devices</li>
                    </ul>
                    
                    <p>Thank you for using InstantResumeAI!</p>
                    
                    <p>Best regards,<br>
                    The InstantResumeAI Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} InstantResumeAI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_password_changed_text(self, user_name: str = None) -> str:
        # This helper function remains unchanged
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        
        return f"""
{greeting}

Your InstantResumeAI account password was successfully changed on {datetime.now().strftime('%B %d, %Y at %I:%M %p UTC')}.

If you did not make this change, please contact our support team immediately at info@instantresumeai.com

For your security, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone  
- Logging out of shared devices

Thank you for using InstantResumeAI!

Best regards,
The InstantResumeAI Team

© {datetime.now().year} InstantResumeAI. All rights reserved.
        """
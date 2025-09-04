# backend/app/services/email_service.py
# note: this might change, remember when the time comes!
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails including password reset and contact form notifications"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        # This 'from_email' is your authenticated user, which MUST match the login credentials.
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'InstantResumeAI')

    # --- NEW: Method to send a welcome email ---
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
        
    def send_contact_inquiry(self, from_name: str, from_email: str, subject: str, message_body: str) -> bool:
        """
        Sends the contact form submission. 
        WARNING: This version spoofs the 'From' address and is not reliable.
        """
        try:
            to_email = self.from_email  # Sending to yourself
            email_subject = f"New Contact Inquiry: {subject}"
            
            # UPDATED: The user's email is now a clickable mailto link
            html_content = f"""
            <h3>You have a new contact form submission:</h3>
            <p><strong>From:</strong> {from_name}</p>
            <p><strong>Email (Reply-To):</strong> <a href="mailto:{from_email}">{from_email}</a></p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr>
            <h4>Message:</h4>
            <p>{message_body.replace('\n', '<br>')}</p>
            """
            
            # The plain text version remains the same
            text_content = f"""
            You have a new contact form submission:
            
            From: {from_name}
            Email (Reply-To): {from_email}
            Subject: {subject}
            
            Message:
            {message_body}
            """

            # This call now includes the from_email_override
            return self._send_email(
                to_email=to_email,
                subject=email_subject,
                html_content=html_content,
                text_content=text_content,
                from_name_override=from_name,
                from_email_override=from_email
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
    
    def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str, reply_to: str = None, from_name_override: str = None, from_email_override: str = None) -> bool:
        """
        Internal method updated to allow overriding the FROM address.
        """
        if not self.smtp_username or not self.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        try:
            # Determine the display name and email for the "From" field
            display_from_name = from_name_override if from_name_override else self.from_name
            display_from_email = from_email_override if from_email_override else self.from_email

            msg = MIMEMultipart('alternative')
            # THIS IS THE RISKY CHANGE: Sets the 'From' header to the user-provided email.
            msg['From'] = f"{display_from_name} <{display_from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # If the from address is spoofed, Reply-To is redundant but harmless.
            if reply_to:
                msg.add_header('Reply-To', reply_to)
            
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # The 'sendmail' method's 'from_addr' should be your authenticated user.
            # Sending with a different 'From' header in the message is the spoof itself.
            auth_user_email = self.from_email

            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(auth_user_email, to_email, msg.as_string())
            else:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(auth_user_email, to_email, msg.as_string())
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error sending to {to_email}: {str(e)}")
            return False
            
    # --- NEW: Private method for welcome email HTML content ---
    def _create_welcome_html(self, user_name: str, user_email: str) -> str:
        """Create HTML content for the welcome email"""
        # A simple, modern email template
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

    # --- NEW: Private method for welcome email plain text content ---
    def _create_welcome_text(self, user_name: str, user_email: str) -> str:
        """Create plain text content for the welcome email"""
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
        Need help? Contact us anytime at info@instantresumeai.com
        """
    
    def _create_password_reset_html(self, reset_token: str, user_name: str = None) -> str:
        """Create HTML content for password reset email"""
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
        """Create plain text content for password reset email"""
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
        """Create HTML content for password change confirmation"""
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
        """Create plain text content for password change confirmation"""
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
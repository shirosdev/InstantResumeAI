# backend/app/services/email_service.py

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
    """Service for sending emails including password reset notifications"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'InstantResumeAI')
        
    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str = None) -> bool:
        """
        Send password reset email with verification code
        
        Args:
            to_email: Recipient email address
            reset_token: 6-digit verification code
            user_name: Optional user name for personalization
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            subject = "Reset Your InstantResumeAI Password"
            
            # Create email content
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
        """
        Send confirmation email after successful password change
        
        Args:
            to_email: Recipient email address
            user_name: Optional user name for personalization
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
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
    
    def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        if not self.smtp_username or not self.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach text and HTML parts
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Use SSL connection for port 465
            if self.smtp_port == 465:
                with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                    server.login(self.smtp_username, self.smtp_password)
                    text = msg.as_string()
                    server.sendmail(self.from_email, to_email, text)
            else:
                # Use STARTTLS for other ports (like 587)
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    text = msg.as_string()
                    server.sendmail(self.from_email, to_email, text)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error sending to {to_email}: {str(e)}")
            return False
    
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
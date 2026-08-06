import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = "noreply@phishx.io" # Replace with your verified sender
        
    def send_email(self, to_email: str, subject: str, html_content: str):
        if not self.api_key or self.api_key == "SG....":
            logger.debug(f"Skipping email to {to_email} (No SendGrid API Key)")
            return False
            
        message = Mail(
            from_email=self.from_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        try:
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            logger.info(f"Email sent to {to_email}, status code: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"SendGrid Error: {e}")
            return False

    def send_verification_email(self, to_email: str, name: str, token: str):
        subject = "Verify your PhishX Account"
        # Point to the backend endpoint which will verify and then redirect to frontend
        verify_url = f"{settings.API_V1_STR_FULL}/auth/verify?token={token}"
        html_content = f"""
            <h3>Welcome to PhishX, {name}!</h3>
            <p>Please click the link below to verify your account:</p>
            <a href="{verify_url}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Account</a>
            <p>If the button doesn't work, copy and paste this link: {verify_url}</p>
        """
        return self.send_email(to_email, subject, html_content)

    def send_password_reset_email(self, to_email: str, token: str):
        subject = "Reset your PhishX Password"
        # The frontend will handle the reset UI
        reset_url = f"{settings.FRONTEND_URL}/?reset_token={token}"
        html_content = f"""
            <h3>Password Reset Request</h3>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <a href="{reset_url}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>If the button doesn't work, copy and paste this link: {reset_url}</p>
        """
        return self.send_email(to_email, subject, html_content)

    def send_trial_otp_email(self, to_email: str, name: str, otp_code: str):
        subject = f"{otp_code} is your PhishX 15-Day Trial Verification Code"
        html_content = f"""
            <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #ffffff; border-radius: 10px;">
                <h2 style="color: #4ade80;">Welcome to PhishX, {name}!</h2>
                <p style="font-size: 16px;">Here is your 6-digit verification code to activate your <strong>15-Day Free Trial</strong>:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #38bdf8; background: #1e293b; padding: 15px 25px; display: inline-block; border-radius: 8px; margin: 15px 0;">
                    {otp_code}
                </div>
                <p style="color: #94a3b8; font-size: 14px;">This code will expire in 10 minutes. If you did not request this trial, please ignore this email.</p>
            </div>
        """
        return self.send_email(to_email, subject, html_content)

email_service = EmailService()

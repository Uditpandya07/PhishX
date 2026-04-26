import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = "noreply@phishx.io" # Replace with your verified sender
        
    def send_email(self, to_email: str, subject: str, html_content: str):
        if not self.api_key or self.api_key == "SG....":
            print(f"[DEBUG] Skipping email to {to_email} (No SendGrid API Key)")
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
            print(f"[DEBUG] Email sent to {to_email}, status code: {response.status_code}")
            return True
        except Exception as e:
            print(f"[DEBUG] SendGrid Error: {e}")
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

email_service = EmailService()

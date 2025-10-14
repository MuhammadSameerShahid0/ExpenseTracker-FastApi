import os
import random
import smtplib
import string
from datetime import datetime
from email.mime.application import MIMEApplication
from fastapi import HTTPException
from starlette import status
from Interfaces.IEmailService import IEmailService
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

FROM_ADDRESS = os.getenv("FROM_ADDRESS")
SMPT_SERVER = os.getenv("SMPT_SERVER")
PORT = os.getenv("PORT")
GOOGLEUSERNAME = os.getenv("GOOGLEUSERNAME")
PASSWORD = os.getenv("PASSWORD")
ENABLESSL = os.getenv("ENABLESSL", "true").lower() == "true"


class EmailService(IEmailService):
    def send_email(self, user_email: str, subject: str, body: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = FROM_ADDRESS
            msg['To'] = user_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(SMPT_SERVER, int(PORT))
            server.ehlo()

            if ENABLESSL:
                server.starttls()

            server.login(GOOGLEUSERNAME, PASSWORD)
            server.send_message(msg)
            server.quit()

            return f"Email sent successfully to {user_email}"
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def email_code(self):
        email_random_code = ''.join(random.choices(string.digits, k=6))
        return email_random_code

    def register_template(self, verification_code: int, name: str) -> str:
        return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; background-color:#f4f6f9;">
        <table align="center" width="600" cellpadding="0" cellspacing="0" 
               style="background:#ffffff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.1); overflow:hidden; margin:40px auto;">

            <!-- Header -->
            <tr>
                <td align="center" style="background: linear-gradient(135deg, #4e73df, #1cc88a); padding:30px;">
                    <h1 style="color:#fff; margin:0; font-size:26px;">🔐 Register Verification</h1>
                    <p style="color:#e9ecef; margin:8px 0 0; font-size:14px;">Secure register details from your device</p>
                </td>
            </tr>

            <!-- Content -->
            <tr>
                <td style="padding:30px;">
                    <p style="font-size:16px; color:#444; margin:0 0 20px;">
                        Hello {name},<br>We noticed a register attempt with the following details:
                    </p>

                    <!-- Verification Code -->
                    <div style="text-align:center; margin:30px 0;">
                        <p style="font-size:15px; color:#555; margin-bottom:10px;">
                            Enter this code to complete your registration:
                        </p>
                        <div style="display:inline-block; background:#4e73df; color:#fff; padding:12px 28px; font-size:24px; letter-spacing:6px; font-weight:bold; border-radius:8px;">
                            {verification_code}
                        </div>
                    </div>

                    <p style="font-size:13px; color:#999; text-align:center;">
                        This code will expire in 10 minutes. If you did not request this registration, please ignore this email.
                    </p>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td align="center" style="background:#f8f9fc; padding:15px; font-size:12px; color:#888;">
                    &copy; {datetime.today().year} ExpenseTracker. All rights reserved.
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    def login_template(self, verification_code: int, name: str) -> str:
        return f"""
       <!DOCTYPE html>
       <html>
       <head>
           <meta charset="UTF-8">
       </head>
       <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; background-color:#f4f6f9;">
           <table align="center" width="600" cellpadding="0" cellspacing="0" 
                  style="background:#ffffff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.1); overflow:hidden; margin:40px auto;">

               <!-- Header -->
               <tr>
                   <td align="center" style="background: linear-gradient(135deg, #4e73df, #1cc88a); padding:30px;">
                       <h1 style="color:#fff; margin:0; font-size:26px;">🔐 Login Verification</h1>
                       <p style="color:#e9ecef; margin:8px 0 0; font-size:14px;">Secure login details from your device</p>
                   </td>
               </tr>

               <!-- Content -->
               <tr>
                   <td style="padding:30px;">
                       <p style="font-size:16px; color:#444; margin:0 0 20px;">
                           Hello {name},<br>We noticed a login attempt with the following details:
                       </p>

                       <!-- Verification Code -->
                       <div style="text-align:center; margin:30px 0;">
                           <p style="font-size:15px; color:#555; margin-bottom:10px;">
                               Enter this code to complete your login:
                           </p>
                           <div style="display:inline-block; background:#4e73df; color:#fff; padding:12px 28px; font-size:24px; letter-spacing:6px; font-weight:bold; border-radius:8px;">
                               {verification_code}
                           </div>
                       </div>

                       <p style="font-size:13px; color:#999; text-align:center;">
                           This code will expire in 10 minutes. If you did not request this login, please ignore this email.
                       </p>
                   </td>
               </tr>

               <!-- Footer -->
               <tr>
                   <td align="center" style="background:#f8f9fc; padding:15px; font-size:12px; color:#888;">
                       &copy; {datetime.today().year} ExpenseTracker. All rights reserved.
                   </td>
               </tr>
           </table>
       </body>
       </html>
       """

    def re_active_account_template(self, verification_code: int, name: str) -> str:
        return f"""
       <!DOCTYPE html>
       <html>
       <head>
           <meta charset="UTF-8">
       </head>
       <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; background-color:#f4f6f9;">
           <table align="center" width="600" cellpadding="0" cellspacing="0" 
                  style="background:#ffffff; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.1); overflow:hidden; margin:40px auto;">

               <!-- Header -->
               <tr>
                   <td align="center" style="background: linear-gradient(135deg, #4e73df, #1cc88a); padding:30px;">
                       <h1 style="color:#fff; margin:0; font-size:26px;">🔐 Re-active account Verification</h1>
                       <p style="color:#e9ecef; margin:8px 0 0; font-size:14px;">Secure details from your device</p>
                   </td>
               </tr>

               <!-- Content -->
               <tr>
                   <td style="padding:30px;">
                       <p style="font-size:16px; color:#444; margin:0 0 20px;">
                           Hello {name},<br>We noticed a re-active account attempt with the following details:
                       </p>

                       <!-- Verification Code -->
                       <div style="text-align:center; margin:30px 0;">
                           <p style="font-size:15px; color:#555; margin-bottom:10px;">
                               Enter this code to re-active your account:
                           </p>
                           <div style="display:inline-block; background:#4e73df; color:#fff; padding:12px 28px; font-size:24px; letter-spacing:6px; font-weight:bold; border-radius:8px;">
                               {verification_code}
                           </div>
                       </div>

                       <p style="font-size:13px; color:#999; text-align:center;">
                           This code will expire in 10 minutes. If you did not request this registration, please ignore this email.
                       </p>
                   </td>
               </tr>

               <!-- Footer -->
               <tr>
                   <td align="center" style="background:#f8f9fc; padding:15px; font-size:12px; color:#888;">
                       &copy; {datetime.today().year} ExpenseTracker. All rights reserved.
                   </td>
               </tr>
           </table>
       </body>
       </html>
       """

    def send_email_with_pdf(self, user_email: str, subject: str, body: str,pdf_path: str = None, pdf_buffer=None, filename: str = None):
        try:
            msg = MIMEMultipart()
            msg['From'] = FROM_ADDRESS
            msg['To'] = user_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, "html"))

            if pdf_buffer:
                attach = MIMEApplication(pdf_buffer.getvalue(), _subtype="pdf")
                attach.add_header(
                    'Content-Disposition',
                    'attachment',
                    filename=filename or f"monthly_report_{user_email.split('@')[0]}.pdf"
                )
                msg.attach(attach)

            elif pdf_path and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as pdf_file:
                    attach = MIMEApplication(pdf_file.read(), _subtype="pdf")
                    attach.add_header(
                        'Content-Disposition',
                        'attachment',
                        filename=filename or f"monthly_report_{user_email.split('@')[0]}.pdf"
                    )
                    msg.attach(attach)
            else:
                raise Exception("No valid PDF provided (neither buffer nor file path).")

            server = smtplib.SMTP(SMPT_SERVER, int(PORT))
            server.ehlo()

            if ENABLESSL:
                server.starttls()

            server.login(GOOGLEUSERNAME, PASSWORD)
            server.send_message(msg)
            server.quit()

            if pdf_path and os.path.exists(pdf_path):
                os.unlink(pdf_path)

            return f"Email with pdf sent successfully to {user_email}"
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def monthly_report_pdf_template(self, user_name : str):
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .greeting {{ font-size: 24px; margin-bottom: 20px; color: #2c3e50; }}
                .message {{ margin-bottom: 25px; font-size: 16px; }}
                .features {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
                .feature-item {{ margin: 10px 0; display: flex; align-items: center; }}
                .feature-icon {{ color: #667eea; margin-right: 10px; font-size: 18px; }}
                .footer {{ text-align: center; margin-top: 30px; padding: 20px; color: #7f8c8d; font-size: 14px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }}
                .stats {{ display: flex; justify-content: space-around; margin: 25px 0; }}
                .stat-item {{ text-align: center; }}
                .stat-number {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                .stat-label {{ font-size: 12px; color: #7f8c8d; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Monthly Expense Report</h1>
                    <p>Your financial insights for {datetime.now().strftime('%B %Y')}</p>
                </div>

                <div class="content">
                    <div class="greeting">
                        Hello {user_name or 'Valued User'}! 👋
                    </div>

                    <div class="message">
                        <p>Your monthly expense report is ready! We've analyzed your spending patterns and compiled a comprehensive overview of your financial activity for the past month.</p>

                        <p>This report includes detailed breakdowns of your expenses, category-wise spending, and insights to help you manage your finances better.</p>
                    </div>

                    <div class="features">
                        <h3 style="color: #2c3e50; margin-top: 0;">📈 What's in your report:</h3>
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>Complete expense breakdown by category</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>Monthly spending trends and patterns</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>Top spending categories highlighted</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>Comparison with previous months</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>Budget vs. actual spending analysis</span>
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <p><strong>💡 Pro Tip:</strong> Review your top spending categories to identify areas where you can optimize your budget for next month.</p>

                        <p style="font-style: italic; color: #667eea;">
                            "A budget is telling your money where to go instead of wondering where it went."
                        </p>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for using <strong>ExpenseTracker</strong> to manage your finances!</p>
                    <p>If you have any questions about your report, please don't hesitate to contact our support team.</p>
                    <p>
                        <a href="https://expense-tracker-fast-api.vercel.app/dashboard" style="color: #667eea; text-decoration: none;">Visit Dashboard</a> • 
                        <a href="https://expense-tracker-fast-api.vercel.app" style="color: #667eea; text-decoration: none;">Contact Support</a>
                    </p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        &copy; {datetime.now().year} ExpenseTracker. All rights reserved.<br>
                        This is an automated email, please do not reply directly.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
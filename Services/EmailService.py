import os
import random
import smtplib
import string
from datetime import datetime
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
                server.starttls()  # Secure the connection with TLS

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

                    <!-- Verify Link -->
                    <div style="text-align:center; margin:35px 0;">
                        <a href="https://localhost:44302/User/VerifyCode?code={verification_code}"
                           style="display:inline-block; padding:12px 24px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-size:16px; font-weight:bold;">
                            Verify Code
                        </a>
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
                       <h1 style="color:#fff; margin:0; font-size:26px;">🔐 Register Verification</h1>
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

                       <!-- Verify Link -->
                       <div style="text-align:center; margin:35px 0;">
                           <a href="https://localhost:44302/User/VerifyCode?code={verification_code}"
                              style="display:inline-block; padding:12px 24px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:6px; font-size:16px; font-weight:bold;">
                               Verify Code
                           </a>
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

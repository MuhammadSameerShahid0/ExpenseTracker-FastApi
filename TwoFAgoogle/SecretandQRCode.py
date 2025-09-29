import base64
from io import BytesIO
import pyotp
import qrcode


def generate_2fa_secret(email: str):
    secret = pyotp.random_base32()
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="ExpenseTracker")
    return secret, otp_uri

def generate_qrcode(opt_uri: str):
    try:
        qr = qrcode.make(opt_uri)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")  # Use a string literal for the format
        qr_buffer = buffer.getvalue()
        response = base64.b64encode(qr_buffer).decode("utf-8")
        return response
    except Exception as ex:
        return {"Error": str(ex)}

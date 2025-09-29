from pydantic import BaseModel


class User2FAResponse(BaseModel):
    msg : str
    qr_code_2fa: str
    secret_key_2fa: str
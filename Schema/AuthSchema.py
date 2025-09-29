from typing import Optional

from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str
    fullname: str
    email: str
    password: str
    status_2fa: bool

class UserRegisterResponse(BaseModel):
    username: str
    fullname: str
    email: str
    status_2fa : bool
    access_token: str
    qr_code_2fa: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePassword(BaseModel):
    fullname: str
    email: Optional[str]
    current_password: Optional[str]
    new_password: Optional[str]
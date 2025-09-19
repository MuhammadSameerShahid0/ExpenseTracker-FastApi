from datetime import datetime
from enum import verify

import pyotp
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from starlette import status
from Models.Table.User import User as UserModel
from Interfaces.IAuthService import IAuthService
from OAuthandJWT.JWTToken import create_jwt
from PasslibPasswordHash.hashpassword import hash_password, verify_password_and_hash
from Schema import AuthSchema
from Schema.AuthSchema import UserRegisterResponse, Token
from Services.EmailService import EmailService
from TwoFAgoogle.SecretandQRCode import generate_2fa_secret, generate_qrcode


class AuthService(IAuthService):
    def __init__(self, db: Session, email_service: EmailService):
        self.db = db
        self.email_service = email_service

    # region register
    def register_user(self, request: AuthSchema.UserCreate, request_session: Request):
        try:
            errors = []

            email_exists = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if email_exists:
                    errors.append(f"Email '{request.email}' already exists")
            username_exists = self.db.query(UserModel).filter(UserModel.username == request.username).first()
            if username_exists:
                    errors.append(f"Username '{request.username}' already exists")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            hashed_password = hash_password(request.password)

            if request.status_2fa:
                secret, otp_uri = generate_2fa_secret(request.email)
                qr_code = generate_qrcode(otp_uri)

                code = self.email_service.email_code()

                subject = f"(ExpenseTracker) Registration code {code}"
                body = self.email_service.register_template(code, request.fullname)
                self.email_service.send_email(
                    request.email,
                    subject,
                    body
                )

                request_session.session["Email code"] = code
                request_session.session["2FA QrCode"] = qr_code
                request_session.session["2FA Secret"] = secret

                request_session.session["User Model"] = {
                    "username": request.username,
                    "fullname": request.fullname,
                    "email": request.email,
                    "password_hash": hashed_password,
                    "secret_2fa": secret,
                    "status_2fa": True
                }

                return f"Verification code sent to email {request.email}"
            else:
                register_user = UserModel(
                    username=request.username,
                    fullname=request.fullname,
                    email=request.email,
                    password_hash=hashed_password,
                    secret_2fa=None,
                    status_2fa=request.status_2fa
                )
                self.db.add(register_user)
                self.db.commit()
                self.db.refresh(register_user)

                token = create_jwt({
                    "id": register_user.id,
                    "email": register_user.email,
                    "username": register_user.username,
                    "from_project": "ExpenseTracker"
                })

                user_response = UserRegisterResponse(
                    username=register_user.username,
                    fullname=register_user.fullname,
                    email=register_user.email,
                    status_2fa=register_user.status_2fa,
                    access_token=token,
                    qr_code_2fa=""
                )
                return user_response
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
    #endregion register

    #region Login
    def login(self, request: AuthSchema.LoginRequest, request_session: Request):
        try:
            errors = []

            user_exists = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if user_exists is None:
                errors.append("Entered Email doesn't exist")

            if user_exists is not None:
                verify_password = verify_password_and_hash(request.password, user_exists.password_hash)
                if not verify_password:
                    errors.append("Entered password not correct")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            # If 2FA is enabled, proceed with 2FA verification process
            if user_exists.status_2fa is True:
                code = self.email_service.email_code()

                subject = f"(ExpenseTracker) Login code {code}"
                body = self.email_service.login_template(code, user_exists.fullname)
                self.email_service.send_email(
                    request.email,
                    subject,
                    body
                )
                request_session.session["Email code"] = code
                request_session.session["2FA Secret"] = user_exists.secret_2fa
                request_session.session["Email"] = user_exists.email
                request_session.session["User Name"] = user_exists.username
                request_session.session["id"] = user_exists.id

                return "Login successful, Enter the email code and Authenticator OTP"

            # If 2FA is disabled, create JWT token directly and return it
            else:
                token = create_jwt({
                    "id": user_exists.id,
                    "email": user_exists.email,
                    "username": user_exists.username,
                    "from_project": "ExpenseTracker"
                })

                return Token(
                    access_token=token,
                    token_type="Bearer"
                )

        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
    #endregion Login

    #region Verify code and otp
    def registration_verify_code_and_otp(self, code: int, otp: str, request_session: Request):
        try:
            errors = []
            qr_code = request_session.session.get("2FA QrCode")
            session_email_code = request_session.session.get("Email code")
            user_record_session = request_session.session.get("User Model")
            session_secret_2fa = request_session.session.get("2FA Secret")

            verif_top = pyotp.TOTP(session_secret_2fa)
            if not verif_top.verify(otp):
                errors.append("Invalid OTP code")

            if session_email_code is None:
                errors.append("Session Expired code not found")

            if str(session_email_code).strip() != str(code).strip():
                errors.append("Invalid Email Code")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            register_user = UserModel(**user_record_session)
            self.db.add(register_user)
            self.db.commit()
            self.db.refresh(register_user)

            token = create_jwt({
                "id" : register_user.id,
                "email": register_user.email,
                "username": register_user.username,
                "from_project": "ExpenseTracker"
            })

            user_response = UserRegisterResponse(
                username=register_user.username,
                fullname=register_user.fullname,
                email=register_user.email,
                status_2fa=register_user.status_2fa,
                access_token=token,
                qr_code_2fa=qr_code
            )
            return user_response

        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def login_verify_code_and_otp(self, code: int, otp: str, request_session: Request):
        try:
            errors = []

            session_email_code = request_session.session.get("Email code")
            session_secret_2fa = request_session.session.get("2FA Secret")
            session_login_email = request_session.session.get("Email")
            session_login_name = request_session.session.get("User Name")
            session_login_id = request_session.session.get("id")

            verif_top = pyotp.TOTP(session_secret_2fa)
            if not verif_top.verify(otp):
                errors.append("Invalid OTP code")

            if str(session_email_code).strip() != str(code).strip():
                errors.append("Invalid Email Code")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            token = create_jwt({
                "id" : session_login_id,
                "email": session_login_email,
                "username": session_login_name,
                "from_project": "ExpenseTracker"
            })

            return Token(
                access_token= token,
                token_type= "Bearer"
            )

        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

        #endregion Verify code and otp

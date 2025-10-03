import os
import uuid
from datetime import datetime
from typing import Optional

import pyotp
from fastapi import HTTPException, Request
from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session
from starlette import status
from starlette.responses import RedirectResponse

from Interfaces.IAuthService import IAuthService
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Models.Table.User import User as UserModel
from OAuthandJWT.JWTToken import create_jwt
from OAuthandJWT.oauth_config import google_oauth
from PasslibPasswordHash.hashpassword import hash_password, verify_password_and_hash
from Schema import AuthSchema
from Schema.AuthSchema import UserRegisterResponse, Token, ChangePassword
from Services.EmailService import EmailService
from TwoFAgoogle.SecretandQRCode import generate_2fa_secret, generate_qrcode

client_id=os.getenv("CLIENT_ID"),
client_secret=os.getenv("CLIENT_SECRET"),

class AuthService(IAuthService):
    def __init__(self, db: Session, email_service: EmailService):
        self.db = db
        self.email_service = email_service
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def _log(self, user_id: int, level: str, message: str, source: str, exception: str = "NULL"):
        self.file_and_db_handler_log.file_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )
        self.file_and_db_handler_log.db_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )

    def _build_redirect(self, base_uri: str, path: str, params: dict) -> RedirectResponse:
        query = "&".join([f"{k}={str(v).replace(' ', '%20')}" for k, v in params.items()])
        return RedirectResponse(url=f"{base_uri}{path}?{query}")

    def _handle_error(self, request: Request, error: str, description: str):
        frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
        if frontend_redirect_uri:
            return self._build_redirect(frontend_redirect_uri, "/login", {
                "error": error,
                "error_description": description
            })
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=description)

    async def google_register(self, request: Request):
        try:
            frontend_redirect_uri = request.query_params.get("frontend_redirect_uri")
            if frontend_redirect_uri is None:
                redirect_uri = os.getenv("REDIRECT_URI")
            else:
                redirect_uri = f"{frontend_redirect_uri}/api/callback"

            if not redirect_uri:
                self._log(None, "ERROR", f"Google register failed: Redirect URI not configured", "AuthService.GoogleRegister")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Redirect URI not configured"
                )

            request.session["frontend_redirect_uri"] = frontend_redirect_uri
            return await google_oauth.google.authorize_redirect(request, redirect_uri)
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                self._log(None, "ERROR", f"Google register failed: {str(ex.detail)}", "AuthService.GoogleRegister")
                raise ex

            self._log(None, "ERROR", "Something went wrong during Google register", "AuthService.GoogleRegister")
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    async def google_callback(self, request: Request):
        try:
            token_data = await google_oauth.google.authorize_access_token(request)
            if not token_data or "userinfo" not in token_data:
                return self._handle_error(request, "google_auth_failed", "Failed to fetch Google user info")

            user_info = token_data["userinfo"]
            frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")

            user_model = self.db.query(UserModel).filter(UserModel.email == user_info['email']).first()

            if user_model:
                #User exists but inactive
                if not user_model.is_active:
                    self._log(user_model.id, "INFO", "Credentials verified, but account inactive", "AuthService.Login")
                    return self._handle_error(
                        request,
                        "google_auth_failed",
                        "Account not active, please reactivate"
                    )

                #User registered via Google
                if user_model.status_2fa is False:
                    if user_model.google_id:
                        token = create_jwt({
                            "id": user_model.id,
                            "email": user_model.email,
                            "username": user_model.fullname,
                            "from_project": "ExpenseTracker"
                        })

                        self._log(user_model.id, "INFO", "Google Login Successful", "AuthService.Login")

                        if frontend_redirect_uri:
                            return self._build_redirect(frontend_redirect_uri, "/dashboard", {
                                "access_token": token, "token_type": "bearer"
                            })

                        return Token(access_token=token, token_type="bearer")

                    #User registered manually (no google_id)
                    return self._handle_error(
                        request,
                        "login_permission",
                        "Login manually, you don’t have permission to login with Google"
                    )

                if user_model.status_2fa is True:
                    if user_model.google_id:
                        code = self.email_service.email_code()

                        subject = f"(ExpenseTracker) You have logged-in via google, login code {code}"
                        body = self.email_service.login_template(code, user_model.fullname)
                        self.email_service.send_email(
                            user_model.email,
                            subject,
                            body
                        )
                        request.session["Email code"] = code
                        request.session["2FA Secret"] = user_model.secret_2fa
                        request.session["Email"] = user_model.email
                        request.session["User Name"] = user_model.username
                        request.session["id"] = user_model.id

                        self._log(user_model.id,
                                  "INFO",
                                  "Credentials verified, Email code and authenticator otp required",
                                  "AuthService.Login")

                        return "Login successful, Enter the email code and Authenticator OTP"

                    return self._handle_error(
                        request,
                        "login_permission",
                        "Login manually, you don’t have permission to login with Google"
                    )

            new_user = UserModel(
                google_id=user_info['sub'],
                username=user_info['name'],
                fullname=user_info['name'],
                email=user_info['email'],
                password_hash="Registered with Google",
                created_at=datetime.now(),
                status_2fa=False,
                secret_2fa=str(uuid.uuid4()),
                is_active=True,
                in_active_date=None,
            )
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            token = create_jwt({
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.fullname,
                "from_project": "ExpenseTracker"
            })

            self._log(new_user.id, "INFO", "Google Register Successful", "AuthService.Register")

            if frontend_redirect_uri:
                return self._build_redirect(frontend_redirect_uri, "/dashboard", {
                    "access_token": token, "token_type": "bearer"
                })

            return Token(access_token=token, token_type="bearer")

        except HTTPException as ex:
            if request.session.get("frontend_redirect_uri"):
                return self._handle_error(request, "auth_error", ex.detail)
            raise

        except Exception as ex:
            if request.session.get("frontend_redirect_uri"):
                return self._handle_error(request, "server_error", "An error occurred during authentication")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(ex))

    # region register
    def register_user(self, request: AuthSchema.UserCreate, request_session: Request):
        try:
            existing_user = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if existing_user:
                if not existing_user.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Account not active, please reactivate."
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{request.email}' already exists"
                )

            if self.db.query(UserModel).filter(UserModel.username == request.username).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Username '{request.username}' already exists"
                )

            hashed_password = hash_password(request.password)

            if request.status_2fa:
                secret, otp_uri = generate_2fa_secret(request.email)
                qr_code = generate_qrcode(otp_uri)
                code = self.email_service.email_code()

                subject = f"(ExpenseTracker) Registration code {code}"
                body = self.email_service.register_template(code, request.fullname)
                self.email_service.send_email(request.email, subject, body)

                request_session.session.update({
                    "Email Code": code,
                    "2FA QrCode": qr_code,
                    "2FA Secret": secret,
                    "User Model": {
                        "google_id": "NULL",
                        "username": request.username,
                        "fullname": request.fullname,
                        "email": request.email,
                        "password_hash": hashed_password,
                        "secret_2fa": secret,
                        "status_2fa": True
                    }
                })

                return f"Verification code sent to {request.email}"

            new_user = UserModel(
                google_id=None,
                username=request.username,
                fullname=request.fullname,
                email=request.email,
                password_hash=hashed_password,
                secret_2fa=None,
                status_2fa=request.status_2fa
            )
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            token = create_jwt({
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.username,
                "from_project": "ExpenseTracker"
            })

            response = UserRegisterResponse(
                username=new_user.username,
                fullname=new_user.fullname,
                email=new_user.email,
                status_2fa=new_user.status_2fa,
                access_token=token,
                qr_code_2fa=""
            )

            self._log(new_user.id, "INFO", f"User registered successfully {request.email} without security", "AuthService.Register")
            return response

        except HTTPException:
            raise  # rethrow known errors
        except Exception as ex:
            user_id: Optional[int] = locals().get("new_user", None) and new_user.id or None
            self._log(user_id, "ERROR", f"Unexpected error during registration: {str(ex)}", "AuthService.Register")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    # endregion register

    # region Login
    def login(self, request: AuthSchema.LoginRequest, request_session: Request):
        global user_exists
        try:
            errors = []

            user_exists = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if user_exists is None:
              errors.append("Entered Email doesn't exist")

            if user_exists.password_hash == "Registered with Google" and  user_exists.google_id is not None:
                self._log(user_exists.id,
                          "ERROR",
                          f"User '{user_exists.email}' tried to login manually, but account registered with google",
                          "AuthService.Login")

                raise HTTPException(
                    status_code=400,
                    detail="Kindly login with google"
                )

            verify_password = verify_password_and_hash(request.password, user_exists.password_hash)
            if not verify_password:
                errors.append("Entered password not correct")

            if user_exists.is_active is False:
                self._log(user_exists.id,
                          "INFO",
                          "Credentials verified, But account not active",
                          "AuthService.Login")

                errors.append("Account not active, re-active if you want")

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

                self._log(user_exists.id,
                          "INFO",
                          "Credentials verified, Email code and authenticator otp required",
                          "AuthService.Login")

                return "Login successful, Enter the email code and Authenticator OTP"

            else:
                token = create_jwt({
                    "id": user_exists.id,
                    "email": user_exists.email,
                    "username": user_exists.username,
                    "from_project": "ExpenseTracker"
                })

                self._log(user_exists.id,
                          "INFO",
                          "Login Successful.",
                          "AuthService.Login")

                return Token(
                    access_token=token,
                    token_type="Bearer"
                )

        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            self._log(user_exists.id if user_exists is not None else 0,
                      "ERROR",
                      "Something Went Wrong, got an error",
                      "AuthService.Login",
                      str(ex))

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
    # endregion Login

    # region Verify code and otp
    def registration_verify_code_and_otp(self, code: int, otp: str, request_session: Request):
        global user_record_session
        try:
            errors = []
            qr_code = request_session.session.get("2FA QrCode")
            session_email_code = request_session.session.get("Email code")
            user_record_session = request_session.session.get("User Model")
            session_secret_2fa = request_session.session.get("2FA Secret")

            verif_top = pyotp.TOTP(session_secret_2fa)
            if not verif_top.verify(otp):
                logger_message = "Enter authenticator OTP invalid"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.RegisterCodeAndOTP",
                    exception="NULL",
                    user_id=None
                )

                errors.append("Invalid OTP code")

            if session_email_code is None:
                errors.append("Session Expired code not found")

            if str(session_email_code).strip() != str(code).strip():
                logger_message = "Entered Email Code is invalid"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.RegisterCodeAndOTP",
                    exception="NULL",
                    user_id=None
                )
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
                qr_code_2fa=qr_code
            )

            self._log(user_exists.id,
                      "INFO",
                      f"'{register_user.email}' Account Created Successfully",
                      "AuthService.RegisterCodeAndOTP")

            return user_response

        except Exception as ex:
            self.db.rollback()

            self._log(user_record_session["id"],
                      "ERROR",
                      "Something Went Wrong, got an error",
                      "AuthService.RegisterCodeAndOTP",
                      str(ex))

            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def login_verify_code_and_otp(self, code: int, otp: str, request_session: Request):
        global session_login_id
        try:
            errors = []

            session_email_code = request_session.session.get("Email code")
            session_secret_2fa = request_session.session.get("2FA Secret")
            session_login_email = request_session.session.get("Email")
            session_login_name = request_session.session.get("User Name")
            session_login_id = request_session.session.get("id")

            verif_top = pyotp.TOTP(session_secret_2fa)
            if not verif_top.verify(otp):
                logger_message = "Entered authenticator Code is invalid"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.LoginCodeAndOTP",
                    exception="NULL",
                    user_id=session_login_id
                )
                errors.append("Invalid OTP code")

            if str(session_email_code).strip() != str(code).strip():
                logger_message = "Entered Email Code is invalid"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.LoginCodeAndOTP",
                    exception="NULL",
                    user_id=session_login_id
                )
                errors.append("Invalid Email Code")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            token = create_jwt({
                "id": session_login_id,
                "email": session_login_email,
                "username": session_login_name,
                "from_project": "ExpenseTracker"
            })

            self._log(session_login_id,
                      "INFO",
                      "Security Code's verified, Login Successful",
                      "AuthService.LoginCodeAndOTP")

            return Token(
                access_token=token,
                token_type="Bearer"
            )

        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            self._log(session_login_id,
                      "ERROR",
                      "Something went wrong, got an error",
                      "AuthService.LoginCodeAndOTP",
                      str(ex))

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
    # endregion Verify code and otp

    # region Delete , active and inactive
    def delete_account(self, user_id: int):
        try:
            user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            user.is_active = False
            user.in_active_date = datetime.now()
            self.db.commit()
            self.db.refresh(user)

            self._log(user_id,
                      "INFO",
                      "Account Deleted Successfully",
                      "AuthService.DeleteAccount")

            return "Account Deleted Successfully"
        except Exception as ex:
            self.db.rollback()
            code = getattr(ex, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            self._log(user_id,
                      "INFO",
                      "Something went wrong, got an error",
                      "AuthService.DeleteAccount",
                      str(ex))

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def re_active_account(self, email: str, request_session: Request):
        try:
            user = self.db.query(UserModel).filter(UserModel.email == email).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            if user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already active"
                )

            code = self.email_service.email_code()

            subject = f"(ExpenseTracker) Re-active account verification code {code}"
            body = self.email_service.re_active_account_template(code, user.fullname)
            self.email_service.send_email(
                user.email,
                subject,
                body
            )
            logger_message = f"Re-active code '{code}' sent to Email"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.ReActiveAccount",
                exception="NULL",
                user_id=user.id
            )

            request_session.session["Email code"] = code
            request_session.session["User Name"] = user.username
            request_session.session["id"] = user.id

            logger_message = "Re-active Account request received and code sent to Email"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.ReActiveAccount",
                exception="NULL",
                user_id=user.id
            )
            return f"Account activation code send to the '{user.email}' email address"
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.ReActiveAccount",
                exception="NULL",
                user_id=None
            )
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def re_active_account_verification_email_code(self, code: int, request_session: Request):
        global session_login_id
        try:
            errors = []

            session_email_code = request_session.session.get("Email code")
            session_login_name = request_session.session.get("User Name")
            session_login_id = request_session.session.get("id")

            if str(session_email_code).strip() != str(code).strip():
                logger_message = f"Entered code '{code}' is invalid"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.ReActiveAccountVerificationCode",
                    exception="NULL",
                    user_id=session_login_id
                )
                errors.append("Invalid Email Code")

            errors_len = len(errors)
            if errors_len > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str.join(" ! ", errors)
                )

            user = self.db.query(UserModel).filter(UserModel.id == session_login_id).first()

            user.is_active = True
            self.db.commit()
            self.db.refresh(user)

            token = create_jwt({
                "id": session_login_id,
                "email": session_email_code,
                "username": session_login_name,
                "from_project": "ExpenseTracker"
            })

            self._log(session_login_id,
                      "INFO",
                      f"Re-active code '{code}' successful, Account activated",
                      "AuthService.AccountReActive")

            return Token(
                access_token=token,
                token_type="Bearer"
            )
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            self._log(session_login_id,
                      "ERROR",
                      "Something went wrong, got an error",
                      "AuthService.ReActiveAccountVerificationCode",
                      str(ex))

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
    # endregion Delete , active and inactive

    # region change password
    def change_password(self, request: ChangePassword):
        global user
        try:
            user = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            if user.google_id is not None and user.password_hash == "Registered with Google":
                if request.new_password:
                    new_password = hash_password(request.new_password)
                    user.password_hash = new_password
                    self.db.commit()
                    self.db.refresh(user)
                    result_message = f"'{user.fullname}' Your password changed successfully"

                    self._log(user.id,
                              "INFO",
                              f"Entered '{user.email}' password changed successfully",
                              "AuthService.ChangePassword")

                    return result_message

            if request.current_password and request.new_password:
                verify_current_password = verify_password_and_hash(request.current_password, user.password_hash)
                if not verify_current_password:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Current password is incorrect"
                    )

                new_password = hash_password(request.new_password)
                user.password_hash = new_password
            elif request.current_password or request.new_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Both current and new password must be provided to change password"
                )

            user.fullname = request.fullname

            self.db.commit()
            self.db.refresh(user)

            if request.current_password and request.new_password:
                logger_message = f"Entered '{user.email}' password changed successfully"
                result_message = f"'{user.fullname}' Your password changed successfully"
            else:
                logger_message = f"Profile information updated for '{user.email}'"
                result_message = f"'{user.fullname}' Your profile updated successfully"

            self._log(user.id,
                      "INFO",
                      logger_message,
                      "AuthService.UpdateProfile")

            return result_message
        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self._log(user.id,
                      "ERROR",
                      logger_message,
                      "AuthService.ChangePassword")

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def google_oauth_cred_from_frontend(self, code: str, request: Request):
        code = request.query_params.get('code')

        if not code:
            return self._handle_error(request, "google_auth_failed", "Failed to fetch Google user info")

        try:
            user_info = id_token.verify_oauth2_token(code, requests.Request(), client_id[0])

            user_model = self.db.query(UserModel).filter(UserModel.email == user_info['email']).first()
            if user_model:
                # User exists but inactive
                if not user_model.is_active:
                    self._log(user_model.id, "INFO", "Credentials verified, but account inactive", "AuthService.Login")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={"message": "Account not active, please reactivate", "email": user_model.email}
                    )

                # User registered via Google
                if user_model.status_2fa is False:
                    if user_model.google_id:
                        token = create_jwt({
                            "id": user_model.id,
                            "email": user_model.email,
                            "username": user_model.fullname,
                            "from_project": "ExpenseTracker"
                        })

                        self._log(user_model.id, "INFO", "Google Login Successful", "AuthService.Login")

                        return Token(access_token=token, token_type="bearer")

                    # User registered manually (no google_id)
                    return self._handle_error(
                        request,
                        "login_permission",
                        "Login manually, you don’t have permission to login with Google"
                    )

                if user_model.status_2fa is True:
                    if user_model.google_id:
                        code = self.email_service.email_code()

                        subject = f"(ExpenseTracker) You have logged-in via google, login code {code}"
                        body = self.email_service.login_template(code, user_model.fullname)
                        self.email_service.send_email(
                            user_model.email,
                            subject,
                            body
                        )
                        request.session["Email code"] = code
                        request.session["2FA Secret"] = user_model.secret_2fa
                        request.session["Email"] = user_model.email
                        request.session["User Name"] = user_model.username
                        request.session["id"] = user_model.id

                        self._log(user_model.id,
                                  "INFO",
                                  "Credentials verified, Email code and authenticator otp required",
                                  "AuthService.Login")

                        return "Login successful, Enter the email code and Authenticator OTP"

                    return self._handle_error(
                        request,
                        "login_permission",
                        "Login manually, you don’t have permission to login with Google"
                    )

            new_user = UserModel(
                google_id=user_info['sub'],
                username=user_info['name'],
                fullname=user_info['name'],
                email=user_info['email'],
                password_hash="Registered with Google",
                created_at=datetime.now(),
                status_2fa=False,
                secret_2fa=str(uuid.uuid4()),
                is_active=True,
                in_active_date=None,
            )
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            token = create_jwt({
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.fullname,
                "from_project": "ExpenseTracker"
            })

            self._log(new_user.id, "INFO", "Google Register Successful", "AuthService.Register")

            return Token(access_token=token, token_type="bearer")

        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.ReActiveAccount",
                exception="NULL",
                user_id=None
            )
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
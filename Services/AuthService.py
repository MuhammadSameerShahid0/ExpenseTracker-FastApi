import os
import uuid
from datetime import datetime
import pyotp
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from starlette import status
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Models.Table.User import User as UserModel
from Interfaces.IAuthService import IAuthService
from OAuthandJWT.JWTToken import create_jwt
from OAuthandJWT.oauth_config import google_oauth
from PasslibPasswordHash.hashpassword import hash_password, verify_password_and_hash
from Schema import AuthSchema
from Schema.AuthSchema import UserRegisterResponse, Token, ChangePassword
from Services.EmailService import EmailService
from TwoFAgoogle.SecretandQRCode import generate_2fa_secret, generate_qrcode


class AuthService(IAuthService):
    def __init__(self, db: Session, email_service: EmailService):
        self.db = db
        self.email_service = email_service
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    async def google_register(self, request: Request):
        try:
            frontend_redirect_uri = request.query_params.get("frontend_redirect_uri")
            if frontend_redirect_uri is None:
                redirect_uri = os.getenv("REDIRECT_URI")
            else:
                redirect_uri = f"{frontend_redirect_uri}/api/callback"

            if not redirect_uri:
                logger_message = "Google register failed: Redirect URI not configured"
                self.file_and_db_handler_log.logger(
                    loglevel="ERROR",
                    message=logger_message,
                    event_source="AuthService.GoogleRegister",
                    exception="Redirect URI not configured",
                    user_id=None
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Redirect URI not configured"
                )
            
            request.session["frontend_redirect_uri"] = frontend_redirect_uri
            return await google_oauth.google.authorize_redirect(request, redirect_uri)
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                logger_message = f"Google register failed: {str(ex.detail)}"
                self.file_and_db_handler_log.logger(
                    loglevel="ERROR",
                    message=logger_message,
                    event_source="AuthService.GoogleRegister",
                    exception=str(ex.detail),
                    user_id=None
                )
                raise ex

            logger_message = "Something went wrong during Google register"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.GoogleRegister",
                exception=str(ex),
                user_id=None
            )
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    async def google_callback(self, request: Request):
        try:
            token = await google_oauth.google.authorize_access_token(request)
            if not token or "userinfo" not in token:
                # Redirect with error if unable to fetch user info
                frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                if frontend_redirect_uri:
                    # Redirect to login page to show the error
                    error_redirect_url = f"{frontend_redirect_uri}/login?error=google_auth_failed&error_description=Failed to fetch Google user info"
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=error_redirect_url)
                else:
                    raise HTTPException(status_code=400, detail="Failed to fetch Google user info")

            user_info = token["userinfo"]
            user_model = self.db.query(UserModel).filter(UserModel.email == user_info['email']).first()
            if user_model is not None:
                if user_model.google_id is not None:
                    if user_model.is_active is False:
                        logger_message = "Credentials verified, But account not active"
                        self.file_and_db_handler_log.logger(
                            loglevel="INFO",
                            message=logger_message,
                            event_source="AuthService.Login",
                            exception="NULL",
                            user_id=user_model.id
                        )
                        frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                        error_redirect_url = f"{frontend_redirect_uri}/login?error=google_auth_failed&error_description=Account not active, Re-active if you want"
                        from fastapi.responses import RedirectResponse
                        return RedirectResponse(url=error_redirect_url)

                    token = create_jwt({
                        "id": user_model.id,
                        "email": user_model.email,
                        "username": user_model.fullname,
                        "from_project": "ExpenseTracker"
                    })

                    # Redirect to frontend with token
                    frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                    if frontend_redirect_uri:
                        logger_message = "Google Login Successful"
                        self.file_and_db_handler_log.logger(
                            loglevel="INFO",
                            message=logger_message,
                            event_source="AuthService.Login",
                            exception="NULL",
                            user_id=user_model.id
                        )
                        from fastapi.responses import RedirectResponse
                        redirect_url = f"{frontend_redirect_uri}/dashboard?access_token={token}&token_type=bearer"
                        return RedirectResponse(url=redirect_url)
                    else:
                        return Token(
                            access_token=token,
                            token_type="bearer"
                        )
                else:
                    # Redirect to login page for users who registered manually
                    frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                    if frontend_redirect_uri:
                        error_redirect_url = f"{frontend_redirect_uri}/login?error=login_permission&error_description={'Login manually, You don\'t have the permission to login with google'.replace(' ', '%20')}"
                        from fastapi.responses import RedirectResponse
                        return RedirectResponse(url=error_redirect_url)
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Login manually, You don't have the permission to login with google"
                        )
            else:
                # New user registration
                user = UserModel(
                    google_id=user_info['sub'],
                    username=user_info['name'],
                    fullname=user_info['name'],
                    email=user_info['email'],
                    password_hash = "Register with google",
                    created_at=datetime.now(),
                    status_2fa=False,
                    secret_2fa=str(uuid.uuid4()),
                    is_active=True,
                    in_active_date = None,
                )

                self.db.add(user)
                self.db.commit()
                self.db.refresh(user)
                token = create_jwt({
                    "id": user.id,
                    "email": user.email,
                    "username": user.fullname,
                    "from_project": "ExpenseTracker"
                })

                logger_message = "Google Register Successful"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Register",
                    exception="NULL",
                    user_id=user.id
                )

                # Redirect to frontend with token
                frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                if frontend_redirect_uri:
                    from fastapi.responses import RedirectResponse
                    redirect_url = f"{frontend_redirect_uri}/dashboard?access_token={token}&token_type=bearer"
                    return RedirectResponse(url=redirect_url)
                else:
                    # Fallback: return JSON response
                    return Token(
                        access_token=token,
                        token_type="bearer"
                    )
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)

            # For HTTP exceptions that should be redirected
            if isinstance(ex, HTTPException):
                frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
                if frontend_redirect_uri:
                    error_redirect_url = f"{frontend_redirect_uri}/login?error=auth_error&error_description={ex.detail.replace(' ', '%20')}"
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=error_redirect_url)
                else:
                    raise ex

            # For other exceptions
            frontend_redirect_uri = request.session.get("frontend_redirect_uri", "")
            if frontend_redirect_uri:
                error_redirect_url = f"{frontend_redirect_uri}/login?error=server_error&error_description={'An error occurred during authentication'.replace(' ', '%20')}"
                from fastapi.responses import RedirectResponse
                return RedirectResponse(url=error_redirect_url)
            else:
                raise HTTPException(
                    status_code=code,
                    detail=str(ex)
                )

    # region register
    def register_user(self, request: AuthSchema.UserCreate, request_session: Request):
        try:
            errors = []

            email_exists = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if email_exists:
                errors.append(f"Email '{request.email}' already exists")
            if email_exists.is_active is False:
                errors.append("Account not active, re-active if you want")
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

                logger_message = f"verification code {code} sent to email"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Register",
                    exception="NULL",
                    user_id=int(request.email)
                )

                request_session.session["Email code"] = code
                request_session.session["2FA QrCode"] = qr_code
                request_session.session["2FA Secret"] = secret

                request_session.session["User Model"] = {
                    "google_id" : "NULL",
                    "username": request.username,
                    "fullname": request.fullname,
                    "email": request.email,
                    "password_hash": hashed_password,
                    "secret_2fa": secret,
                    "status_2fa": True
                }

                logger_message = f"Security Enabled '{request.email}', Added in db after verification"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Register",
                    exception="NULL",
                    user_id=int(request.email)
                )

                return f"Verification code sent to email {request.email}"
            else:
                register_user = UserModel(
                    google_id=None,
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

                logger_message = f"Account Registered Successfully '{request.email}' Security Disabled"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Register",
                    exception="NULL",
                    user_id=int(request.email)
                )
                return user_response
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something Went Wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.Register",
                exception=str(ex),
                user_id=int(request.email)
            )

            raise HTTPException(
                status_code=code,
                detail=str(ex)
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

            if user_exists.password_hash == "Register with google" and user_exists.google_id is not None:
                logger_message = f"User '{user_exists.email}' tried to login manually, but account registered with google"
                self.file_and_db_handler_log.logger(
                    loglevel="ERROR",
                    message=logger_message,
                    event_source="AuthService.Login",
                    exception="NULL",
                    user_id=user_exists.id
                )
                raise HTTPException(
                    status_code=400,
                    detail="Kindly login with google"
                )

            if user_exists is not None:
                verify_password = verify_password_and_hash(request.password, user_exists.password_hash)
                if not verify_password:
                    errors.append("Entered password not correct")

            if user_exists.is_active is False:
                logger_message = "Credentials verified, But account not active"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Login",
                    exception="NULL",
                    user_id=user_exists.id
                )

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

                logger_message = "Credentials verified, Email code and authenticator otp required"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Login",
                    exception="NULL",
                    user_id=user_exists.id
                )

                return "Login successful, Enter the email code and Authenticator OTP"

            # If 2FA is disabled, create JWT token directly and return it
            else:
                token = create_jwt({
                    "id": user_exists.id,
                    "email": user_exists.email,
                    "username": user_exists.username,
                    "from_project": "ExpenseTracker"
                })

                logger_message = "Login Successful."
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.Login",
                    exception="NULL",
                    user_id=user_exists.id
                )

                return Token(
                    access_token=token,
                    token_type="Bearer"
                )

        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something Went Wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.Login",
                exception=str(ex),
                user_id=user_exists.id
            )

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    # endregion Login

    # region Verify code and otp
    def registration_verify_code_and_otp(self, code: int, otp: str, request_session: Request):
        try:
            errors = []
            qr_code = request_session.session.get("2FA QrCode")
            session_email_code = request_session.session.get("Email code")
            user_record_session = request_session.session.get("User Model")
            session_secret_2fa = request_session.session.get("2FA Secret")

            verif_top = pyotp.TOTP(session_secret_2fa)
            if not verif_top.verify(otp):
                logger_message = "Enter authenticator OTP invalid"
                self.file_and_db_handler_log.logger(
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
                self.file_and_db_handler_log.logger(
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

            logger_message = f"'{register_user.email}' Account Created Successfully"
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.RegisterCodeAndOTP",
                exception="NULL",
                user_id=register_user.id
            )

            return user_response

        except Exception as ex:
            self.db.rollback()

            logger_message = "Something Went Wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.RegisterCodeAndOTP",
                exception=str(ex),
                user_id=user_record_session["id"]
            )

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
                logger_message = "Entered authenticator Code is invalid"
                self.file_and_db_handler_log.logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="AuthService.LoginCodeAndOTP",
                    exception="NULL",
                    user_id=session_login_id
                )
                errors.append("Invalid OTP code")

            if str(session_email_code).strip() != str(code).strip():
                logger_message = "Entered Email Code is invalid"
                self.file_and_db_handler_log.logger(
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

            logger_message = "Security Code's verified, Login Successful"
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.LoginCodeAndOTP",
                exception="NULL",
                user_id=session_login_id
            )
            return Token(
                access_token=token,
                token_type="Bearer"
            )

        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.LoginCodeAndOTP",
                exception=str(ex),
                user_id=None
            )

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

        # endregion Verify code and otp

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

            logger_message = "Account Deleted Successfully"
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.DeleteAccount",
                exception="NULL",
                user_id=user_id
            )

            return "Account Deleted Successfully"
        except Exception as ex:
            self.db.rollback()
            code = getattr(ex, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.DeleteAccount",
                exception=str(ex),
                user_id=user_id
            )

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
            self.file_and_db_handler_log.logger(
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
            self.file_and_db_handler_log.logger(
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
            self.file_and_db_handler_log.logger(
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
        try:
            errors = []

            session_email_code = request_session.session.get("Email code")
            session_login_name = request_session.session.get("User Name")
            session_login_id = request_session.session.get("id")

            if str(session_email_code).strip() != str(code).strip():
                logger_message = f"Entered code '{code}' is invalid"
                self.file_and_db_handler_log.logger(
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

            logger_message = f"Re-active code '{code}' successful, Account activated"
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.ReActiveAccountVerificationCode",
                exception="NULL",
                user_id=user.id
            )

            return Token(
                access_token=token,
                token_type="Bearer"
            )
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.ReActiveAccountVerificationCode",
                exception=str(ex),
                user_id=None
            )
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    # endregion Delete , active and inactive

    # region change password
    def change_password(self, request: ChangePassword):
        try:
            user = self.db.query(UserModel).filter(UserModel.email == request.email).first()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            if user.google_id is not None and user.password_hash == "Register with google":
                if request.new_password:
                    new_password = hash_password(request.new_password)
                    user.password_hash = new_password
                    self.db.commit()
                    self.db.refresh(user)
                    logger_message = f"Entered '{user.email}' password changed successfully"
                    result_message = f"'{user.fullname}' Your password changed successfully"
                    self.file_and_db_handler_log.logger(
                        loglevel="INFO",
                        message=logger_message,
                        event_source="AuthService.ChangePassword",
                        exception="NULL",
                        user_id=user.id
                    )
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
            
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AuthService.UpdateProfile",
                exception="NULL",
                user_id=user.id
            )
            
            return result_message
        except Exception as ex:
            self.db.rollback()
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            logger_message = "Something went wrong, got an error"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AuthService.ChangePassword",
                exception=str(ex),
                user_id=None
            )
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

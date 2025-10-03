from fastapi import FastAPI, APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IAuthService import IAuthService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema import AuthSchema
from Schema.AuthSchema import Token, UserRegisterResponse, ChangePassword

AuthRouter = APIRouter(tags=["Auth"])
service_factory = MySqlServiceFactory()

def get_auth_service(db: Session = Depends(get_db)) -> IAuthService:
    return  service_factory.auth_service(db)

Auth_Db_DI = Depends(get_auth_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@AuthRouter.get("/register_via_google")
async def register(request: Request, service: IAuthService = Auth_Db_DI):
    return await service.google_register(request)

@AuthRouter.get("/callback")
async def callback(request: Request, service: IAuthService = Auth_Db_DI):
    return await service.google_callback(request)

@AuthRouter.post("/register")
def register(request_session: Request,
             request: AuthSchema.UserCreate,
             services : IAuthService = Auth_Db_DI
             ):
    try:
        result = services.register_user(request, request_session)
        if isinstance(result, UserRegisterResponse):
            return result
        qr_code = request_session.session.get("2FA QrCode", "")
        secret_key = request_session.session.get("2FA Secret")
        return {"message": result, "qr_code_2fa": qr_code, "secret_key_2fa": secret_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AuthRouter.post("/login")
def login(request_session: Request,
             request: AuthSchema.LoginRequest,
             services : IAuthService = Auth_Db_DI
             ):
    result = services.login(request, request_session)
    if isinstance(result, Token):
        return result
    return result

@AuthRouter.get("/RegistrationVerificationEmailCodeAnd2FAOtp")
def verification_code_and_otp(request_session: Request,
                              code : int,
                              otp : str,
                              services : IAuthService = Auth_Db_DI):
    return services.registration_verify_code_and_otp(code, otp, request_session)

@AuthRouter.get("/LoginVerificationEmailCodeAnd2FAOtp")
def login_verification_code_and_otp(request_session: Request,
                              code : int,
                              otp : str,
                              services : IAuthService = Auth_Db_DI):
    return services.login_verify_code_and_otp(code, otp, request_session)

@AuthRouter.post("/verify-token")
def verify_token(payload: dict = Depends(verify_jwt)):
    return {"user": payload}

@AuthRouter.delete("/delete-account")
def delete_account(services : IAuthService = Auth_Db_DI,
                   current_user: dict = Depends(get_current_user)):
    return services.delete_account(current_user["id"])

@AuthRouter.post("/re-active-account")
def reactive_account( request_session: Request, email : str, services : IAuthService = Auth_Db_DI):
    return services.re_active_account(email, request_session)

@AuthRouter.post("/re-active-account-verification-email-code")
def reactive_account_verification_email_code(code : int,
                                             request_session: Request,
                                             services : IAuthService = Auth_Db_DI
                                             ):
    return services.re_active_account_verification_email_code(code, request_session)

@AuthRouter.post("/change-password")
def change_password(request: ChangePassword, services : IAuthService = Auth_Db_DI):
    return services.change_password(request)

@AuthRouter.post("/google_oauth_cred")
def google_oauth_code_from_frontend(code : str,
                                          request: Request,
                                          services : IAuthService = Auth_Db_DI):
    return services.google_oauth_cred_from_frontend(code, request)
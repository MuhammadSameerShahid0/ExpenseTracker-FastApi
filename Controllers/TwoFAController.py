from fastapi import FastAPI, APIRouter, Depends, Request
from sqlalchemy.orm import Session

from Cache.RedisCache import clear_cache_by_pattern
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.ITwoFaService import ITwoFaService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt

app = FastAPI()
TwoFaRouter = APIRouter(tags=["2FA"])
service_factory = MySqlServiceFactory()

def get_twofa_service(db: Session = Depends(get_db)) -> ITwoFaService:
    return  service_factory.twofa_service(db)

TwoFa_Db_DI = Depends(get_twofa_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@TwoFaRouter.post("/2fa_enable")
def enable_2fa(request: Request,
             services: ITwoFaService = TwoFa_Db_DI,
             current_user: dict = Depends(get_current_user)):
    result = services.enable_2fa(current_user["id"], request)
    clear_cache_by_pattern(f"Get-User-Details:{current_user["id"]}")
    return result

@TwoFaRouter.post("/2fa_disable")
def disable_2fa(services: ITwoFaService = TwoFa_Db_DI,
             current_user: dict = Depends(get_current_user)):
    result = services.disable_2fa(current_user["id"])
    clear_cache_by_pattern(f"Get-User-Details:{current_user["id"]}")
    return result

@TwoFaRouter.post("/verify_2fa")
def after_enable2fa_verify_otp(code : str,
                               request: Request,
                               services: ITwoFaService = TwoFa_Db_DI,
                               current_user: dict = Depends(get_current_user)):
    result = services.after_enable2fa_verify_otp(code, request, current_user["id"])
    clear_cache_by_pattern(f"Get-User-Details:{current_user["id"]}")
    return result
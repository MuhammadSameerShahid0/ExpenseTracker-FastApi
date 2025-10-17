from fastapi import APIRouter, Depends, HTTPException, FastAPI
from sqlalchemy.orm import Session

from Cache.RedisCache import get_cache, set_cache
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IUserService import IUserService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema.UserSchema import ContactSchema

app = FastAPI()
UserRouter = APIRouter(tags=["User"])
service_factory = MySqlServiceFactory()

def get_user_service(db: Session = Depends(get_db)) -> IUserService:
    return service_factory.user_service(db)

User_Db_DI = Depends(get_user_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@UserRouter.get("/user_details")
def get_user_details(services: IUserService = User_Db_DI, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user["id"]
        cache_key = f"Get-User-Details:{user_id}"
        cached = get_cache(cache_key)
        if cached:
            return cached
        data =  services.get_user_details(user_id)
        set_cache(cache_key, data, ex=600)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@UserRouter.post("/contact")
def contact( request : ContactSchema, services: IUserService = User_Db_DI):
    try:
        return services.contact_message(request)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
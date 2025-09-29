from fastapi import FastAPI, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.ILoggingService import ILoggingService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt

app = FastAPI()
LoggingRouter = APIRouter(tags=["Logging"])
service_factory = MySqlServiceFactory()

def get_logging_service(db: Session = Depends(get_db)) -> ILoggingService:
    return service_factory.logging_service(db)

logging_Db_DI = Depends(get_logging_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@LoggingRouter.get("/auth_logging")
def auth_logging(services: ILoggingService = logging_Db_DI,
                 current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        user_id =current_user["id"]
        return services.get_user_auth_logs(user_id, email)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@LoggingRouter.get("/return_selected_logging")
def auth_logging(services: ILoggingService = logging_Db_DI,
                 current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        user_id =current_user["id"]
        return services.return_selected_logging(user_id, email)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, FastAPI
from sqlalchemy.orm import Session
from starlette import status
from Controllers.WebhookController import SECRET_KEY_TRIGGER
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IUserService import IUserService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema.UserSchema import ContactSchema
from Webhook.pdf_tasks import generate_and_send_monthly_reports

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
        return services.get_user_details(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@UserRouter.post("/contact")
def contact( request : ContactSchema, services: IUserService = User_Db_DI):
    try:
        return services.contact_message(request)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@UserRouter.post("/tggrigger-monthly-report")
def trggigger_monthly_report(secret_key: str):
    if secret_key != SECRET_KEY_TRIGGER:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid secret key."
        )
    task = generate_and_send_monthly_reports()
    return {"status": "success", "message": task}
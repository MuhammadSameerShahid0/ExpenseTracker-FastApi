import os

from fastapi import HTTPException, Depends, APIRouter
from requests import Session
from starlette import status

from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IWebhookService import IWebhookService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema.SubscriberSchema import SubscriberCreate
from Webhook.pdf_tasks import generate_and_send_monthly_reports

WebhookRouter = APIRouter(tags=["Webhook"])
service_factory = MySqlServiceFactory()

SECRET_KEY_TRIGGER = os.getenv("QSTASH_CURRENT_SIGNING_KEY")

def get_webhook_service(db: Session = Depends(get_db)) -> IWebhookService:
    return service_factory.webhook_service(db)

Webhook_Db_DI = Depends(get_webhook_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@WebhookRouter.post("/subscribed-monthly-pdf")
def monthly_report_subscriber(request: SubscriberCreate,
                              services: IWebhookService = Webhook_Db_DI,
                              current_user: dict = Depends(get_current_user)):
    try:
        request.email = current_user["email"]
        request.name = current_user["username"]
        service_user = services.subscribed_monthly_report(request)
        return service_user
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@WebhookRouter.post("/unsubscribed-monthly-pdf")
def monthly_report_unsubscriber(services: IWebhookService = Webhook_Db_DI,
                                current_user: dict = Depends(get_current_user)):
    try:
        email = current_user["email"]
        unsubscribe_report = services.unsubscribed_monthly_report(email)
        return unsubscribe_report
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@WebhookRouter.post("/trigger-monthly-report")
def trigger_monthly_report(secret_key: str):
    if secret_key != SECRET_KEY_TRIGGER:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid secret key."
        )
    task = generate_and_send_monthly_reports()
    return {"status": "success", "message": task}
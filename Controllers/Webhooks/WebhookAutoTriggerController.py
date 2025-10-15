import os

from fastapi import APIRouter, HTTPException
from starlette import status

from Factory.AbstractFactory import MySqlServiceFactory
from Webhook.pdf_tasks import generate_and_send_monthly_reports

AutoTriggerRouter = APIRouter(tags=["WebhooksAutoTrigger"])
service_factory = MySqlServiceFactory()

SECRET_KEY_TRIGGER = os.getenv("QSTASH_CURRENT_SIGNING_KEY")

@AutoTriggerRouter.post("/trigger-monthly-report")
def trigger_monthly_report(secret_key: str):
    if secret_key != SECRET_KEY_TRIGGER:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid secret key."
        )
    task = generate_and_send_monthly_reports()
    return {"status": "success", "message": task}
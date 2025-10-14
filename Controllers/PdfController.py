from fastapi import APIRouter, Depends
from requests import Session
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IPdfService import IPdfService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from  Webhook.pdf_tasks import generate_and_send_monthly_reports

PdfRouter = APIRouter(tags=["Pdf"])
service_factory = MySqlServiceFactory()

def get_pdf_service(db: Session = Depends(get_db)) -> IPdfService:
    return service_factory.pdf_service(db)

PDf_Db_DI = Depends(get_pdf_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@PdfRouter.get("/expenses/pdf")
def download_expenses_pdf(
        skip: int = 0,
        limit: int = 100,
        services: IPdfService = PDf_Db_DI,
        current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    username = current_user['username']
    return services.download_expenses_pdf(user_id,username,skip,limit)


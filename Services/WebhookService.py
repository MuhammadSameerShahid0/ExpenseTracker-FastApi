from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status
from Models.Table.Subscriber import Subscriber as SubscriberModel
from Interfaces.IWebhookService import IWebhookService
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Schema.SubscriberSchema import SubscriberCreate
from Services.EmailService import EmailService

class WebhookService(IWebhookService):
    def __init__(self, db: Session,email_service: EmailService):
        self.db = db
        self.email_service = email_service
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def subscribed_monthly_report(self, request: SubscriberCreate):
        subscriber_model = self.db.query(SubscriberModel).filter(SubscriberModel.email == request.email).first()
        if subscriber_model:
            if subscriber_model.is_active:
                raise HTTPException(status_code=409, detail="Subscriber already active. Login again to UnSubscribe this service")

            subscriber_model.is_active = request.is_active
            self.db.commit()
            self.db.refresh(subscriber_model)
            return f"ThankYou! {request.name} for subscribing the monthly report."

        if not subscriber_model:
            subscriber = SubscriberModel(
                email=request.email,
                name=request.name,
                is_active=request.is_active
            )

            self.db.add(subscriber)
            self.db.commit()
            self.db.refresh(subscriber)

            return f"ThankYou! {request.name} for subscribing the monthly report."

        raise HTTPException (status_code=400,detail="Something went wrong.")

    def unsubscribed_monthly_report(self, email: str):
        subscriber_model = self.db.query(SubscriberModel).filter(SubscriberModel.email == email).first()
        if subscriber_model:
            if not subscriber_model.is_active:
                raise HTTPException(status_code=404, detail="Subscriber not active. Login again to subscribe this service")

            subscriber_model.is_active = False

            self.db.commit()
            self.db.refresh(subscriber_model)

            return f"{subscriber_model.name} you have successfully unsubscribed the monthly report."
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscriber not found.."
        )
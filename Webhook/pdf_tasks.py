from fastapi import HTTPException
from starlette import status
from Models.Table.User import User as UserModel
from Services.EmailService import EmailService
from Webhook.celery_worker import celery_app
from Services.PdfService import PdfService
from Services.ExpenseService import ExpenseService
from Models.Database import SessionLocal
from datetime import datetime, timedelta
from Models.Table.Subscriber import Subscriber

@celery_app.task(name="generate_and_send_monthly_reports")
def generate_and_send_monthly_reports():
    db = SessionLocal()
    try:
        subscribers = db.query(Subscriber).filter(Subscriber.is_active == True).all()
        if not subscribers:
            return "No active subscribers found"

        expense_service = ExpenseService(db)
        pdf_service = PdfService(db, expense_service)
        email_service = EmailService()

        for sub in subscribers:
            user = db.query(UserModel).filter(UserModel.email == sub.email).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            # Generate PDF
            expenses = expense_service.get_previous_month_expenses(user.id, skip=0, limit=1000)
            pdf_buffer = pdf_service.generate_expenses_pdf(expenses)

            last_day_prev_month = datetime.now().replace(day=1) - timedelta(days=1)

            # Send email
            subject = f"Your {last_day_prev_month.strftime('%B-%Y')} Expense Report from ExpenseTracker"
            body = email_service.monthly_report_pdf_template(sub.name)
            filename = f"ExpenseTracker-{last_day_prev_month.strftime('%B-%Y')}-Report.pdf"
            email_service.send_email_with_pdf(
                user_email=sub.email,
                subject=subject,
                body=body,
                pdf_buffer=pdf_buffer,
                filename=filename
            )

        db.close()
        return f"Reports sent to {len(subscribers)} subscribers."
    except Exception as ex:
        db.close()
        code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        if isinstance(ex, HTTPException):
            raise ex

        raise HTTPException(
            status_code=code,
            detail=str(ex)
        )
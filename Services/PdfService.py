import zlib
from io import BytesIO
from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
from requests import Session
from starlette import status
from starlette.responses import Response
from Interfaces.IPdfService import IPdfService
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Services.ExpenseService import ExpenseService

class PdfService(IPdfService):
    def __init__(self, db: Session, expense_service: ExpenseService):
        self.db = db
        self.expense_service = expense_service
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def _log(self, user_id: int, level: str, message: str, source: str, exception: str = "NULL"):
        self.file_and_db_handler_log.file_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )
        self.file_and_db_handler_log.db_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )

    def download_expenses_pdf(
            self,
            user_id: int,
            username: str,
            skip: int = 0,
            limit: int = 1000):
        try:
            expenses = self.expense_service.get_expenses(user_id, skip, limit)
            pdf_buffer = self.generate_expenses_pdf(expenses)
            return Response(
                content=pdf_buffer.getvalue(),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename=Expenses_Report_{username}.pdf"
                },
            )
        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def generate_expenses_pdf(self, expenses: list):
        try:
            buffer = BytesIO()
            pdf = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                leftMargin=30,
                rightMargin=30,
                topMargin=40,
                bottomMargin=30
            )
            elements = []
            styles = getSampleStyleSheet()

            title = Paragraph("ExpenseTracker Report", styles["Title"])
            elements.append(title)
            elements.append(Spacer(1, 12))

            website_text = '<a href="https://expense-tracker-fast-api.vercel.app/" color="blue">ExpenseTracker.com</a>'
            website = Paragraph(website_text, styles["Normal"])
            elements.append(website)
            elements.append(Spacer(1, 12))

            date_info = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"])
            elements.append(date_info)
            elements.append(Spacer(1, 12))

            data = [["Date", "Description", "Category", "Payment Method", "Amount (PKR)"]]
            total_amount = 0.0

            for expense in expenses:
                data.append([
                    expense.date.strftime("%Y-%m-%d"),
                    expense.description,
                    expense.category_name,
                    expense.payment_method,
                    f"{expense.amount:,.2f}"
                ])

                total_amount += expense.amount

            data.append(["", "", "", Paragraph("<b>Total Spent</b>", styles["Normal"]), f"{total_amount:,.2f}"])

            table = Table(data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('BACKGROUND', (0, 1), (-1, -2), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('ALIGN', (-1, 1), (-1, -1), 'RIGHT'),
                ('BACKGROUND', (0, -1), (-1, -1), colors.beige),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ]))

            elements.append(table)
            pdf.build(elements)
            buffer.seek(0)
            pdf_data = buffer.read()

            max_size = 500 * 1024
            if len(pdf_data) > max_size:
                compressed_data = zlib.compress(pdf_data, level=9)
                if len(compressed_data) < max_size:
                    pdf_data = compressed_data  # Use compressed version

            output = BytesIO(pdf_data)
            output.seek(0)

            return output

        except Exception as ex:
            code = getattr(ex, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )
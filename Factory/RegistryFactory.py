from sqlalchemy.orm import Session

from Services.BudgetService import BudgetService
from Services.LoggingService import LoggingService
from Services.TwoFaService import TwoFaService
from Services.AuthService import AuthService
from Services.ExpenseService import ExpenseService
from Services.AnalyticsService import AnalyticsService
from Services.UserService import UserService
from Services.EmailService import EmailService


class ServiceFactory:

    _services = {
        "auth" : AuthService,
        "expense" : ExpenseService,
        "analytics" : AnalyticsService,
        "user" : UserService,
        "twofa" : TwoFaService,
        "logging" : LoggingService,
        "budget" : BudgetService,
    }

    @staticmethod
    def get_services(service_type : str, db : Session):
        service_cls = ServiceFactory._services.get(service_type.lower())
        if not service_cls:
            raise Exception(f"Service type {service_type} is not supported")
        if service_type == "auth" or service_type == "user":
            email_service = EmailService()
            return service_cls(db, email_service)
        return service_cls(db)
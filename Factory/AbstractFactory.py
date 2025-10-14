from sqlalchemy.orm import Session

from Factory.Interface.IAbstractFactory import IAbstractFactory
from Factory.RegistryFactory import ServiceFactory
from Interfaces.IBudgetService import IBudgetService
from Interfaces.ILoggingService import ILoggingService
from Interfaces.IPdfService import IPdfService
from Interfaces.ITwoFaService import ITwoFaService
from Interfaces.IAuthService import IAuthService
from Interfaces.IExpenseService import IExpenseService
from Interfaces.IAnalyticsService import IAnalyticsService
from Interfaces.IUserService import IUserService
from Interfaces.IWebhookService import IWebhookService


class MySqlServiceFactory(IAbstractFactory):
    def auth_service(self, db: Session) -> IAuthService:
        return ServiceFactory.get_services("auth", db)
        
    def expense_service(self, db: Session) -> IExpenseService:
        return ServiceFactory.get_services("expense", db)
        
    def analytics_service(self, db: Session) -> IAnalyticsService:
        return ServiceFactory.get_services("analytics", db)

    def user_service(self, db: Session) -> IUserService:
        return ServiceFactory.get_services("user", db)

    def twofa_service(self, db: Session) -> ITwoFaService:
        return ServiceFactory.get_services("twofa", db)

    def logging_service(self, db: Session) -> ILoggingService:
        return ServiceFactory.get_services("logging", db)

    def budget_service(self, db: Session) -> IBudgetService:
        return ServiceFactory.get_services("budget", db)

    def pdf_service(self, db:Session) -> IPdfService:
        return ServiceFactory.get_services("pdf", db)

    def webhook_service(self, db:Session) -> IWebhookService:
        return ServiceFactory.get_services("webhook", db)
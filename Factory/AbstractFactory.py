from sqlalchemy.orm import Session

from Factory.Interface.IAbstractFactory import IAbstractFactory
from Factory.RegistryFactory import ServiceFactory
from Interfaces.IAuthService import IAuthService
from Interfaces.IExpenseService import IExpenseService
from Interfaces.IAnalyticsService import IAnalyticsService


class MySqlServiceFactory(IAbstractFactory):
    def auth_service(self, db: Session) -> IAuthService:
        return ServiceFactory.get_services("auth", db)
        
    def expense_service(self, db: Session) -> IExpenseService:
        return ServiceFactory.get_services("expense", db)
        
    def analytics_service(self, db: Session) -> IAnalyticsService:
        return ServiceFactory.get_services("analytics", db)
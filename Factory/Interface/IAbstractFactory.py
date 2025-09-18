from abc import ABC, abstractmethod

from sqlalchemy.orm import Session
from Interfaces.IAuthService import IAuthService
from Interfaces.IExpenseService import IExpenseService


class IAbstractFactory(ABC):
    @abstractmethod
    def auth_service(self, db: Session) -> IAuthService:
        pass

    @abstractmethod
    def expense_service(self, db: Session) -> IExpenseService:
        pass
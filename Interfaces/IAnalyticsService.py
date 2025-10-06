from abc import ABC, abstractmethod
from typing import List
from Schema.ExpenseSchema import ExpenseResponse

class IAnalyticsService(ABC):

    @abstractmethod
    def get_total_expense_amount(self, user_id: int) -> float:
        pass

    @abstractmethod
    def get_monthly_expense_amount(self, user_id: int, year: int, month: int) -> float:
        pass

    @abstractmethod
    def get_total_transactions(self, user_id: int) -> int:
        pass

    @abstractmethod
    def get_monthly_transactions(self, user_id: int, year: int, month: int) -> int:
        pass

    @abstractmethod
    def get_recent_transactions(self, user_id: int, limit: int = 5) -> List[ExpenseResponse]:
        pass

    @abstractmethod
    def amount_budget_against_transactions(self, user_id: int):
        pass
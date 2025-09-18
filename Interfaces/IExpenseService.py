from abc import ABC, abstractmethod
from typing import List
from Schema.ExpenseSchema import ExpenseCreate, ExpenseResponse, CategoryCreate, CategoryResponse

class IExpenseService(ABC):

    @abstractmethod
    def add_expense(self, expense: ExpenseCreate, user_id: int) -> ExpenseResponse:
        pass

    @abstractmethod
    def get_expenses(self, user_id: int, skip: int = 0, limit: int = 100) -> List[ExpenseResponse]:
        pass

    @abstractmethod
    def add_category(self, category: CategoryCreate, user_id: int) -> CategoryResponse:
        pass

    @abstractmethod
    def get_categories(self, user_id: int) -> List[CategoryResponse]:
        pass

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
    def get_recent_transactions(self, user_id: int, limit: int = 5) -> List[ExpenseResponse]:
        pass
from abc import ABC, abstractmethod
from typing import List


class IBudgetService(ABC):

    @abstractmethod
    def add_budget(self, user_id: int, amount: float,category_id: int) -> str:
        pass

    @abstractmethod
    def get_budgets(self, user_id: int, month : str) -> List[dict]:
        pass

    @abstractmethod
    def budget_month_total(self, user_id: int, month: str) -> float:
        pass

    @abstractmethod
    def edit_budget_amount(self, user_id: int, category_id : int, amount: float) -> str:
        pass

    @abstractmethod
    def delete_set_budget(self, user_id: int, category_id: int) -> str:
        pass
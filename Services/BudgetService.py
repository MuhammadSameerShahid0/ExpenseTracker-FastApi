from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from Models.Table.Budget import Budget as BudgetModel
from Models.Table.Category import Category as CategoryModel
from Interfaces.IBudgetService import IBudgetService


class BudgetService(IBudgetService):
    def __init__(self, db: Session):
        self.db = db

    def add_budget(self, user_id: int, amount: float, category_id: int):
        try:
            errors = []
            current_month = datetime.now().month
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.category_id == category_id).first()
            if user_budget is not None:
                if user_budget.month <= str(current_month):
                    errors.append(f"This category budget for this month already set")

            check_category = self.db.query(CategoryModel).filter(CategoryModel.id == category_id,
                                                                 CategoryModel.user_id == user_id).first()
            if check_category is None:
                errors.append("Category does not exist. You need to create it first")

            error_len = len(errors)
            if error_len > 0:
                raise HTTPException(
                    status_code=400,
                    detail=str.join(" ! ", errors)
                )

            response = BudgetModel(
                category_id=category_id,
                limit_amount=amount,
                user_id=user_id,
                month=str(current_month)
            )

            self.db.add(response)
            self.db.commit()
            self.db.refresh(response)

            return f"Budget '{amount}' set with category '{check_category.name}' created successfully"
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def get_budgets(self, user_id: int) -> List[dict]:
        try:
            budgets = self.db.query(
                BudgetModel.id,
                BudgetModel.limit_amount,
                BudgetModel.month,
                BudgetModel.user_id,
                CategoryModel.name.label("category_name"),
                CategoryModel.id.label("category_id")
            ).join(
                CategoryModel, BudgetModel.category_id == CategoryModel.id
            ).filter(
                BudgetModel.user_id == user_id
            ).all()

            result = []
            for budget in budgets:
                result.append({
                    "id": budget.id,
                    "amount": float(budget.limit_amount),
                    "month": budget.month,
                    "user_id": budget.user_id,
                    "category_name": budget.category_name,
                    "category_id": budget.category_id
                })

            return result
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def budget_month_total(self, user_id: int, month: str):
        try:
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.month == month).all()
            if user_budget is []:
                return 0.0
            return sum(exp.limit_amount for exp in user_budget)
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def edit_budget_amount(self, user_id: int, category_id: int, amount: float):
        try:
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.category_id == category_id).first()
            if user_budget is not None:
                user_budget.limit_amount = amount
                self.db.commit()
                self.db.refresh(user_budget)

                return "Successfully updated budget amount"
            return "Failed to update budget amount"
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def delete_set_budget(self, user_id: int, category_id: int):
        try:
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id, BudgetModel.category_id == category_id).first()
            if user_budget is not None:
                category = self.db.query(CategoryModel).filter(CategoryModel.id == user_budget.category_id).first()

                self.db.delete(user_budget)
                self.db.commit()

                return f"Budget for category '{category.name}' with amount '{user_budget.limit_amount}' deleted successfully"
            return "Failed to delete budget amount"
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

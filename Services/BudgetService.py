from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from Models.Table.Budget import Budget as BudgetModel
from Models.Table.Category import Category as CategoryModel
from Interfaces.IBudgetService import IBudgetService
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog

class BudgetService(IBudgetService):
    def __init__(self, db: Session):
        self.db = db
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def _log(self, user_id: int, level: str, message: str, source: str, exception: str = "NULL"):
        self.file_and_db_handler_log.file_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )
        self.file_and_db_handler_log.db_logger(
            loglevel=level, message=message, event_source=source, exception=exception, user_id=user_id
        )

    def add_budget(self, user_id: int, amount: float, category_id: int):
        global user_budget
        try:
            errors = []
            current_month = datetime.now().month
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.category_id == category_id).first()

            check_category = self.db.query(CategoryModel).filter(CategoryModel.id == category_id,
                                                                 CategoryModel.user_id == user_id).first()
            if check_category is None:
                errors.append("Category does not exist. You need to create it first")

            if user_budget is not None:
                if user_budget.month <= str(current_month):
                    errors.append(f"Category '{user_budget.category.name}' budget for this month already set")

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

            self._log(user_id,
                      "INFO",
                      f"Budget of {amount} set for category {check_category.name} successfully",
                      "BudgetService.AddBudget")

            return f"Budget '{amount}' set with category '{check_category.name}' created successfully"
        except Exception as ex:
            self._log(user_id,
                      "ERROR",
                      f"Error setting budget, category {user_budget.category.name} already set for this month",
                      "BudgetService.AddBudget",
                      str(ex))

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

            logger_message = f"Retrieved {len(result)} budgets for user"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="BudgetService.GetBudgets",
                exception="NULL",
                user_id=user_id
            )

            return result
        except Exception as ex:
            logger_message = f"Error retrieving budgets for user"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="BudgetService.GetBudgets",
                exception=str(ex),
                user_id=user_id
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(ex)
            )

    def budget_month_total(self, user_id: int, month: str):
        try:
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.month == month).all()
            if user_budget is []:
                result = 0.0
            else:
                result = sum(exp.limit_amount for exp in user_budget)

            logger_message = f"Retrieved monthly budget total {result} for user, month {month}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="BudgetService.BudgetMonthTotal",
                exception="NULL",
                user_id=user_id
            )

            return result
        except Exception as ex:
            logger_message = f"Error retrieving monthly budget total for user, month {month}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="BudgetService.BudgetMonthTotal",
                exception=str(ex),
                user_id=user_id
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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

                self._log(user_id,
                          "INFO",
                          f"Budget amount updated to {amount} for category {user_budget.category.name}",
                          "BudgetService.EditBudgetAmount")
                return "Successfully updated budget amount"

            return "Failed to update budget amount"
        except Exception as ex:
            logger_message = f"Error updating budget amount for category to {amount}"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "BudgetService.EditBudgetAmount",
                      str(ex))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(ex)
            )

    def delete_set_budget(self, user_id: int, category_id: int):
        global user_budget
        try:
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id, BudgetModel.category_id == category_id).first()
            if user_budget is not None:
                category = self.db.query(CategoryModel).filter(CategoryModel.id == user_budget.category_id).first()

                self.db.delete(user_budget)
                self.db.commit()

                logger_message = f"Budget for category '{category.name}' with amount '{user_budget.limit_amount}' deleted successfully"
                self._log(user_id,
                          "INFO",
                          logger_message,
                          "BudgetService.DeleteSetBudget")
                return f"Budget for category '{category.name}' with amount '{user_budget.limit_amount}' deleted successfully"

            return "Failed to delete budget amount"
        except Exception as ex:
            logger_message = f"Error deleting budget for category {category.name}"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "BudgetService.DeleteSetBudget",
                      str(ex))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(ex)
            )
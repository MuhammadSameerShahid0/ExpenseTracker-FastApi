from datetime import datetime
from typing import List

from fastapi import HTTPException
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from starlette import status

from Interfaces.IAnalyticsService import IAnalyticsService
from Schema.ExpenseSchema import ExpenseResponse, BudgetAgainstTransaction
from Models.Table.Transaction import Transaction as TransactionModel
from Models.Table.Category import Category as CategoryModel
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Models.Table.Budget import Budget as BudgetModel

class AnalyticsService(IAnalyticsService):
    def __init__(self, db: Session):
        self.db = db
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def get_total_expense_amount(self, user_id: int) -> float:
        try:
            total = self.db.query(func.sum(TransactionModel.amount)).filter(
                TransactionModel.user_id == user_id
            ).scalar()
            
            result = float(total) if total else 0.0
            
            logger_message = f"Total expense amount retrieved: {result}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AnalyticsService.TotalExpenseAmount",
                exception="NULL",
                user_id=user_id
            )
            
            return result
        except Exception as ex:
            logger_message = f"Error retrieving total expense amount: {ex}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AnalyticsService.TotalExpenseAmount",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def get_monthly_expense_amount(self, user_id: int, year: int, month: int) -> float:
        try:
            expenses = self.db.query(TransactionModel).filter(
                TransactionModel.user_id == user_id,
                extract('year', TransactionModel.date) == year,
                extract('month', TransactionModel.date) == month
            ).all()

            if expenses:
                result = sum(exp.amount for exp in expenses)
            else:
                result = 0.0
                
            logger_message = f"Monthly expense amount, year {year}, month {month}: {result}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AnalyticsService.MonthlyExpenseAmount",
                exception="NULL",
                user_id=user_id
            )
            
            return result
        except Exception as ex:
            logger_message = f"Error retrieving monthly expense amount, year {year}, month {month}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AnalyticsService.MonthlyExpenseAmount",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def get_total_transactions(self, user_id: int) -> int:
        try:
            result = self.db.query(TransactionModel).filter(
                TransactionModel.user_id == user_id
            ).count()
            
            logger_message = f"Total transaction count retrieved: {result}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AnalyticsService.TotalTransactions",
                exception="NULL",
                user_id=user_id
            )
            
            return result
        except Exception as ex:
            logger_message = f"Error retrieving total transaction count"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AnalyticsService.TotalTransactions",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def get_monthly_transactions(self, user_id: int, year: int, month: int) -> int:
        try:
            result = self.db.query(TransactionModel).filter(
                TransactionModel.user_id == user_id,
                extract('year', TransactionModel.date) == year,
                extract('month', TransactionModel.date) == month
            ).count()
            
            logger_message = f"Monthly transaction count retrieved, year {year}, month {month}: {result}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AnalyticsService.MonthlyTransactions",
                exception="NULL",
                user_id=user_id
            )
            
            return result
        except Exception as ex:
            logger_message = f"Error retrieving monthly transaction count, year {year}, month {month}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AnalyticsService.MonthlyTransactions",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def get_recent_transactions(self, user_id: int, limit: int = 5) -> List[ExpenseResponse]:
        try:
            expenses = (
                self.db.query(TransactionModel)
                .filter(TransactionModel.user_id == user_id)
                .order_by(TransactionModel.date.desc())
                .limit(limit)
                .all()
            )

            results = []
            for expense in expenses:
                category = self.db.query(CategoryModel).filter(CategoryModel.id == expense.category_id).first()
                results.append(
                    ExpenseResponse(
                        id=expense.id,
                        amount=expense.amount,
                        description=expense.description,
                        date=expense.date,
                        category_name=category.name if category else "Unknown",
                        payment_method=expense.payment_method if expense.payment_method is not None else "Unknown"
                    )
                )
                
            logger_message = f"Recent transactions retrieved, limit {limit}: {len(results)} transactions found"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="AnalyticsService.RecentTransactions",
                exception="NULL",
                user_id=user_id
            )
            
            return results
        except Exception as ex:
            logger_message = f"Error retrieving recent transactions, limit {limit}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="AnalyticsService.RecentTransactions",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def amount_budget_against_transactions(self, user_id: int, month: int):
        try:
            result = []
            user_budget = self.db.query(BudgetModel).filter(BudgetModel.user_id == user_id,
                                                            BudgetModel.month == month).all()
            if user_budget is not None:
                for budgets in user_budget:
                    budget_categories = self.db.query(CategoryModel).filter(CategoryModel.id == budgets.category_id).all()
                    for categories in budget_categories:
                        transaction_category = (self.db.query(TransactionModel).filter
                                                (TransactionModel.category_id == categories.id,
                                                 extract('month', TransactionModel.date) == month).all())
                        total = sum(t.amount for t in transaction_category)

                        if total == 0:
                            continue

                        result.append(
                            BudgetAgainstTransaction(
                                budget_limit_amount= budgets.limit_amount,
                                category_name= categories.name,
                                spent_amount= total
                            )
                        )

                return result
            return 0
        except Exception as ex:
            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

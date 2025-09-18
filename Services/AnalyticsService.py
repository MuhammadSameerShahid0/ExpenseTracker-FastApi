from typing import List
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from datetime import datetime

from Interfaces.IAnalyticsService import IAnalyticsService
from Schema.ExpenseSchema import ExpenseResponse
from Models.Table.Transaction import Transaction as TransactionModel
from Models.Table.Category import Category as CategoryModel

class AnalyticsService(IAnalyticsService):
    def __init__(self, db: Session):
        self.db = db

    def get_total_expense_amount(self, user_id: int) -> float:
        total = self.db.query(func.sum(TransactionModel.amount)).filter(
            TransactionModel.user_id == user_id
        ).scalar()
        
        return float(total) if total else 0.0

    def get_monthly_expense_amount(self, user_id: int, year: int, month: int) -> float:
        expenses = self.db.query(TransactionModel).filter(
            TransactionModel.user_id == user_id,
            extract('year', TransactionModel.date) == year,
            extract('month', TransactionModel.date) == month
        ).all()

        if expenses:
            return sum(exp.amount for exp in expenses)
        return 0.0

    def get_total_transactions(self, user_id: int) -> int:
        return self.db.query(TransactionModel).filter(
            TransactionModel.user_id == user_id
        ).count()

    def get_monthly_transactions(self, user_id: int, year: int, month: int) -> int:
        return self.db.query(TransactionModel).filter(
            TransactionModel.user_id == user_id,
            extract('year', TransactionModel.date) == year,
            extract('month', TransactionModel.date) == month
        ).count()

    def get_recent_transactions(self, user_id: int, limit: int = 5) -> List[ExpenseResponse]:
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
        return results
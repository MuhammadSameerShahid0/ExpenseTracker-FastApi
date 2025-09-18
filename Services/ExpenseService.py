from typing import List

from sqlalchemy import extract
from sqlalchemy.orm import Session
from datetime import datetime

from Interfaces.IExpenseService import IExpenseService
from Schema.ExpenseSchema import ExpenseCreate, ExpenseResponse, CategoryCreate, CategoryResponse
from Models.Table.Transaction import Transaction as TransactionModel
from Models.Table.Category import Category as CategoryModel
from Models.Table.User import User as UserModel

class ExpenseService(IExpenseService):
    def __init__(self, db: Session):
        self.db = db

    def add_expense(self, expense: ExpenseCreate, user_id: int) -> ExpenseResponse:
        # Check if category exists or create it
        category = self.db.query(CategoryModel).filter(
            CategoryModel.name == expense.category_name,
            CategoryModel.user_id == user_id
        ).first()
        
        if not category:
            # Create new category if it doesn't exist
            category = CategoryModel(
                name=expense.category_name,
                type="expense",
                user_id=user_id
            )
            self.db.add(category)
            self.db.commit()
            self.db.refresh(category)
        
        # Create the expense transaction
        db_expense = TransactionModel(
            amount=expense.amount,
            description=expense.description,
            date=expense.date or datetime.now(),
            category_id=category.id,
            user_id=user_id,
            payment_method = expense.payment_method
        )
        
        self.db.add(db_expense)
        self.db.commit()
        self.db.refresh(db_expense)
        
        return ExpenseResponse(
            id=db_expense.id,
            amount=db_expense.amount,
            description=db_expense.description,
            date=db_expense.date,
            category_name=category.name,
            payment_method=db_expense.payment_method
        )

    def get_expenses(self, user_id: int, skip: int = 0, limit: int = 100) -> List[ExpenseResponse]:
        expenses = self.db.query(TransactionModel).filter(
            TransactionModel.user_id == user_id
        ).offset(skip).limit(limit).all()
        
        expense_responses = []
        for expense in expenses:
            category = self.db.query(CategoryModel).filter(CategoryModel.id == expense.category_id).first()
            expense_responses.append(ExpenseResponse(
                id=expense.id,
                amount=expense.amount,
                description=expense.description,
                date=expense.date,
                category_name=category.name if category else "Unknown"
            ))
        
        return expense_responses

    def add_category(self, category: CategoryCreate, user_id: int) -> CategoryResponse:
        # Check if category already exists
        existing_category = self.db.query(CategoryModel).filter(
            CategoryModel.name == category.name,
            CategoryModel.user_id == user_id
        ).first()

        if existing_category:
            raise Exception("Category already exists")

        db_category = CategoryModel(
            name=category.name,
            type=category.type,
            user_id=user_id
        )
        
        self.db.add(db_category)
        self.db.commit()
        self.db.refresh(db_category)
        
        return CategoryResponse(
            id=db_category.id,
            name=db_category.name,
            type=db_category.type
        )

    def get_categories(self, user_id: int) -> List[CategoryResponse]:
        categories = self.db.query(CategoryModel).filter(
            CategoryModel.user_id == user_id
        ).all()
        
        return [
            CategoryResponse(
                id=category.id,
                name=category.name,
                type=category.type
            ) for category in categories
        ]

    def get_total_expense_amount(self, user_id: int) -> float:
        total_amount = self.db.query(TransactionModel).filter(
            TransactionModel.user_id == user_id
        ).all()

        if total_amount:
            amount_total = []
            for transaction in total_amount:
                amount_total.append(transaction.amount)
            return sum(amount_total)
        else:
            return 0.0


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

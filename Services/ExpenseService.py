from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from starlette import status
from Interfaces.IExpenseService import IExpenseService
from Schema.ExpenseSchema import ExpenseCreate, ExpenseResponse, CategoryCreate, CategoryResponse, EditExpenseList
from Models.Table.Transaction import Transaction as TransactionModel
from Models.Table.Category import Category as CategoryModel
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog

class ExpenseService(IExpenseService):
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

    def add_expense(self, expense: ExpenseCreate, user_id: int) -> ExpenseResponse:
        try:
            category = self.db.query(CategoryModel).filter(
                CategoryModel.name == expense.category_name,
                CategoryModel.user_id == user_id
            ).first()

            if not category:
                category = CategoryModel(
                    name=expense.category_name,
                    type="expense",
                    user_id=user_id
                )
                self.db.add(category)
                self.db.commit()
                self.db.refresh(category)

                logger_message = f"New category '{expense.category_name}' created for expense"
                self._log(user_id,
                          "INFO",
                          logger_message,
                          "ExpenseService.AddExpense")

            db_expense = TransactionModel(
                amount=expense.amount,
                description=expense.description,
                date=datetime.now,
                category_id=category.id,
                user_id=user_id,
                payment_method = expense.payment_method
            )

            self.db.add(db_expense)
            self.db.commit()
            self.db.refresh(db_expense)

            logger_message = f"Expense of {expense.amount} added with description: {expense.description}"
            self._log(user_id,
                      "INFO",
                      logger_message,
                      "ExpenseService.AddExpense")

            return ExpenseResponse(
                id=db_expense.id,
                amount=db_expense.amount,
                description=db_expense.description,
                date=db_expense.date,
                category_name=category.name,
                payment_method=db_expense.payment_method
            )
        except Exception as ex:
            logger_message = f"Error adding expense with amount {expense.amount}"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "ExpenseService.AddExpense",
                      str(ex))
            raise ex

    def get_expenses(self, user_id: int, skip: int = 0, limit: int = 100) -> List[ExpenseResponse]:
        try:
            expenses = self.db.query(TransactionModel).filter(
                TransactionModel.user_id == user_id
            ).order_by(TransactionModel.date.desc()).offset(skip).limit(limit).all()

            expense_responses = []
            for expense in expenses:
                category = self.db.query(CategoryModel).filter(CategoryModel.id == expense.category_id).first()
                expense_responses.append(ExpenseResponse(
                    id=expense.id,
                    amount=expense.amount,
                    description=expense.description,
                    date=expense.date,
                    category_name=category.name if category else "Unknown",
                    payment_method=expense.payment_method if expense.payment_method is not None else "Unknown"
                ))

            logger_message = f"Retrieved {len(expense_responses)} expenses, skip: {skip}, limit: {limit}"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="ExpenseService.GetExpenses",
                exception="NULL",
                user_id=user_id
            )

            return expense_responses
        except Exception as ex:
            logger_message = f"Error retrieving expenses, skip: {skip}, limit: {limit}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="ExpenseService.GetExpenses",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def add_category(self, category: CategoryCreate, user_id: int) -> CategoryResponse:
        try:
            # Check if category already exists
            existing_category = self.db.query(CategoryModel).filter(
                CategoryModel.name == category.name,
                CategoryModel.user_id == user_id
            ).first()

            if existing_category:
                logger_message = f"Attempt to add duplicate category '{category.name}'"
                self._log(user_id,
                          "WARNING",
                          logger_message,
                          "ExpenseService.AddCategory",
                          "Category already exists")

                raise Exception("Category already exists")

            db_category = CategoryModel(
                name=category.name,
                type=category.type,
                user_id=user_id
            )

            self.db.add(db_category)
            self.db.commit()
            self.db.refresh(db_category)

            logger_message = f"Category '{category.name}' added successfully"
            self._log(user_id,
                      "INFO",
                      logger_message,
                      "ExpenseService.AddCategory")

            return CategoryResponse(
                id=db_category.id,
                name=db_category.name,
                type=db_category.type
            )
        except Exception as ex:
            logger_message = f"Error adding category '{category.name}'"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "ExpenseService.AddCategory",
                      str(ex))

            raise ex

    def get_categories(self, user_id: int) -> List[CategoryResponse]:
        try:
            categories = self.db.query(CategoryModel).filter(
                CategoryModel.user_id == user_id
            ).all()

            result = [
                CategoryResponse(
                    id=category.id,
                    name=category.name,
                    type=category.type
                ) for category in categories
            ]
            
            logger_message = f"Retrieved {len(result)} categories"
            self.file_and_db_handler_log.file_logger(
                loglevel="INFO",
                message=logger_message,
                event_source="ExpenseService.GetCategories",
                exception="NULL",
                user_id=user_id
            )

            return result
        except Exception as ex:
            logger_message = f"Error retrieving categories"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="ExpenseService.GetCategories",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def edit_expense_list(self, user_id: int ,request: EditExpenseList):
        try:
            if request.datetime > datetime.now():
                logger_message = f"Attempt to edit expense with future date by user"
                self._log(user_id,
                          "WARNING",
                          logger_message,
                          "ExpenseService.EditExpenseList",
                          "Future date not allowed")

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You can't add the future expense, correct the date"
                )

            transaction = self.db.query(TransactionModel).filter(TransactionModel.user_id == user_id , TransactionModel.id == request.transaction_id).first()
            if transaction is None:
                logger_message = f"No transaction found for user {user_id} and transaction id {request.transaction_id}"
                self.file_and_db_handler_log.file_logger(
                    loglevel="WARNING",
                    message=logger_message,
                    event_source="ExpenseService.EditExpenseList",
                    exception="No transaction found",
                    user_id=user_id
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No transaction found against this user"
                )

            category_model = self.db.query(CategoryModel).filter(CategoryModel.id == request.category_id).first()
            if category_model is None:
                logger_message = f"No category found for category id {request.category_id}"
                self.file_and_db_handler_log.file_logger(
                    loglevel="WARNING",
                    message=logger_message,
                    event_source="ExpenseService.EditExpenseList",
                    exception="No category found",
                    user_id=user_id
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No category found against this user"
                )

            transaction.amount = request.amount
            transaction.category_id = category_model.id
            transaction.description = request.description
            transaction.payment_method = request.payment_method
            transaction.date = request.datetime if request.datetime else datetime.now()

            self.db.commit()
            self.db.refresh(transaction)

            logger_message = f"Expense list updated successfully for category {category_model.name}"
            self._log(user_id,
                      "INFO",
                      logger_message,
                      "ExpenseService.EditExpenseList")

            return f"Successfully updated expense list"
        except Exception as ex:
            logger_message = f"Error editing expense list, transaction id {request.transaction_id}"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "ExpenseService.EditExpenseList",
                      str(ex))

            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def delete_expense_list_item(self, user_id: int, transaction_id: int):
        try:
            transaction_model = self.db.query(TransactionModel).filter(TransactionModel.user_id == user_id, TransactionModel.id == transaction_id).first()
            if transaction_model is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"No transaction found for user {user_id} and transaction id {transaction_id}"
                )

            category_name = transaction_model.category.name if transaction_model.category else "Unknown"
            payment_method = transaction_model.payment_method

            self.db.delete(transaction_model)
            self.db.commit()

            logger_message = f"Successfully deleted expense item '{category_name}' against payment method {payment_method}"
            self._log(user_id,
                      "INFO",
                      logger_message,
                      "ExpenseService.DeleteExpenseListItem")
            return f"Successfully deleted expense item '{category_name}' against payment method {payment_method}"
        except Exception as ex:
            logger_message = f"Error deleting expense item, transaction id {transaction_id}"
            self._log(user_id,
                      "ERROR",
                      logger_message,
                      "ExpenseService.DeleteExpenseListItem",
                      str(ex))

            code = getattr(500, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

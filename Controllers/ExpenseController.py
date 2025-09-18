from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema.ExpenseSchema import ExpenseCreate, ExpenseResponse, CategoryCreate, CategoryResponse
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IExpenseService import IExpenseService

ExpenseRouter = APIRouter(tags=["Expenses"])
service_factory = MySqlServiceFactory()

def get_expense_service(db: Session = Depends(get_db)) -> IExpenseService:
    return service_factory.expense_service(db)

Expense_Db_DI = Depends(get_expense_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@ExpenseRouter.post("/expenses", response_model=ExpenseResponse)
def add_expense(
    expense: ExpenseCreate,
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.add_expense(expense, current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    skip: int = 0,
    limit: int = 100,
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_expenses(current_user["id"], skip, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.post("/categories", response_model=CategoryResponse)
def add_category(
    category: CategoryCreate,
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.add_category(category, current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=400 if "already exists" in str(e) else 500, detail=str(e))

@ExpenseRouter.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_categories(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.get("/total_amount")
def get_total_amount(
        services: IExpenseService = Expense_Db_DI,
        current_user: dict = Depends(get_current_user)):
    try:
        return services.get_total_expense_amount(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.get("/monthly_total")
def get_monthly_total(
    year: int = Query(..., description="Year e.g. 2025"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_monthly_expense_amount(current_user["id"], year, month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.get("/total_transactions")
def get_total_transactions(
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return {"total_transactions": services.get_total_transactions(current_user["id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@ExpenseRouter.get("/recent_transactions", response_model=List[ExpenseResponse])
def get_recent_transactions(
    limit: int = Query(5, ge=1, le=20, description="Number of recent transactions to fetch"),
    services: IExpenseService = Expense_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_recent_transactions(current_user["id"], limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


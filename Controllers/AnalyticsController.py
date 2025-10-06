from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt
from Schema.ExpenseSchema import ExpenseResponse
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IAnalyticsService import IAnalyticsService

AnalyticsRouter = APIRouter(tags=["Analytics"])
service_factory = MySqlServiceFactory()

def get_analytics_service(db: Session = Depends(get_db)) -> IAnalyticsService:
    return service_factory.analytics_service(db)

Analytics_Db_DI = Depends(get_analytics_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@AnalyticsRouter.get("/total_amount")
def get_total_amount(
        services: IAnalyticsService = Analytics_Db_DI,
        current_user: dict = Depends(get_current_user)):
    try:
        return services.get_total_expense_amount(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/monthly_total")
def get_monthly_total(
    year: int = Query(..., description="Year e.g. 2025"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_monthly_expense_amount(current_user["id"], year, month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/total_transactions")
def get_total_transactions(
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return {"total_transactions": services.get_total_transactions(current_user["id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/monthly_transactions")
def get_monthly_transactions(
    year: int = Query(..., description="Year e.g. 2025"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_monthly_transactions(current_user["id"], year, month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/recent_transactions", response_model=List[ExpenseResponse])
def get_recent_transactions(
    limit: int = Query(5, ge=1, le=20, description="Number of recent transactions to fetch"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    try:
        return services.get_recent_transactions(current_user["id"], limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/budget-against-transactions")
def budget_amount_against_transactions(current_user: dict = Depends(get_current_user),
                                       services: IAnalyticsService = Analytics_Db_DI):
    return services.amount_budget_against_transactions(current_user["id"])
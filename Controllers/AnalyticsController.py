from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from Cache.RedisCache import get_cache, set_cache
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
    cache_key = f"analytics:total_amount:{current_user['id']}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    try:
        data = services.get_total_expense_amount(current_user["id"])
        set_cache(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/monthly_total")
def get_monthly_total(
    year: int = Query(..., description="Year e.g. 2025"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    cache_key = f"analytics:monthly_total:{current_user['id']}:{year}:{month}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    try:
        data = services.get_monthly_expense_amount(current_user["id"], year, month)
        set_cache(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/total_transactions")
def get_total_transactions(
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    cache_key = f"analytics:get_total_transactions:{current_user['id']}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    try:
        data = services.get_total_transactions(current_user["id"])
        set_cache(cache_key, data)
        data = {"total_transactions": data}
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/monthly_transactions")
def get_monthly_transactions(
    year: int = Query(..., description="Year e.g. 2025"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    cache_key = f"analytics:get_monthly_transactions:{current_user['id']}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    try:
        data = services.get_monthly_transactions(current_user["id"], year, month)
        set_cache(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/recent_transactions", response_model=List[ExpenseResponse])
def get_recent_transactions(
    limit: int = Query(5, ge=1, le=20, description="Number of recent transactions to fetch"),
    services: IAnalyticsService = Analytics_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    cache_key = f"analytics:get_recent_transactions:{current_user['id']}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    try:
        data = services.get_recent_transactions(current_user["id"], limit)
        set_cache(cache_key, data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@AnalyticsRouter.get("/budget-against-transactions")
def budget_amount_against_transactions(current_user: dict = Depends(get_current_user),
                                       services: IAnalyticsService = Analytics_Db_DI):
    cache_key = f"analytics:budget_vs_transactions:{current_user['id']}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    data = services.amount_budget_against_transactions(current_user["id"])
    set_cache(cache_key, data)
    return data
from fastapi import FastAPI, APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Optional

from Cache.RedisCache import clear_cache_by_pattern, get_cache, set_cache
from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IBudgetService import IBudgetService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt

app = FastAPI()
BudgetRouter = APIRouter(tags=["Budget"])
service_factory = MySqlServiceFactory()

def get_budget_service(db: Session = Depends(get_db)) -> IBudgetService:
    return service_factory.budget_service(db)

Budget_Db_DI = Depends(get_budget_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@BudgetRouter.post("/add-budget")
def add_budget(
    limit: float = Body(...),
    category_id: int = Body(...),
    services: IBudgetService = Budget_Db_DI,
    current_user: dict = Depends(get_current_user)):

    user_id = current_user["id"]
    result = services.add_budget(user_id, limit, category_id)
    clear_cache_by_pattern(f"analytics:*:{current_user['id']}*")
    clear_cache_by_pattern(f"categories:{current_user['id']}:*")
    clear_cache_by_pattern(f"budget:{current_user['id']}:*")
    clear_cache_by_pattern(f"budget:GetBudgets:{user_id}:*")
    return result

@BudgetRouter.get("/budgets")
def get_budgets(month : str,
    services: IBudgetService = Budget_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    cache_key = f"budget:GetBudgets:{user_id}:{month}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    data = services.get_budgets(user_id, month)
    set_cache(cache_key, data, ex=600)
    return data

@BudgetRouter.get("/total-set-budget-amount-according-to-month")
def total_budget_month_amount(month : str,
                              services: IBudgetService = Budget_Db_DI,
    current_user: dict = Depends(get_current_user)):

    user_id = current_user["id"]
    cache_key = f"budget:{user_id}:{month}"
    cached = get_cache(cache_key)
    if cached:
        return cached
    data = services.budget_month_total(user_id, month)
    set_cache(cache_key, data, ex=600)
    return data

@BudgetRouter.post("/Edit_budget_amount")
def edit_budget(
        category_id: int = Body(...),
        amount: float = Body(...),
        services: IBudgetService = Budget_Db_DI,
        current_user: dict = Depends(get_current_user)):

    user_id = current_user["id"]
    result = services.edit_budget_amount(user_id, category_id, amount)
    clear_cache_by_pattern(f"analytics:*:{user_id}*")
    clear_cache_by_pattern(f"categories:{user_id}:*")
    clear_cache_by_pattern(f"budget:{user_id}:*")
    clear_cache_by_pattern(f"budget:GetBudgets:{user_id}:*")
    return result

@BudgetRouter.delete("/delete_set_budget")
def delete_budget(
        category_id: int,
        services: IBudgetService = Budget_Db_DI,
        current_user: dict = Depends(get_current_user)):

    user_id = current_user["id"]
    result = services.delete_set_budget(user_id, category_id)
    clear_cache_by_pattern(f"analytics:*:{user_id}*")
    clear_cache_by_pattern(f"categories:{user_id}:*")
    clear_cache_by_pattern(f"budget:{user_id}:*")
    clear_cache_by_pattern(f"budget:GetBudgets:{user_id}:*")
    return result